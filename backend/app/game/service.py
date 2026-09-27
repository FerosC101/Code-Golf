"""Database-level game operations. Orchestration (locks, timers, broadcasts)
lives in app.game.runtime; this module only reads and writes state."""

import secrets
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.game.problems import SAMPLE_PACK
from app.game.scoring import DEFAULT_SCORING, competition_rank, points_for_rank
from app.models import GameRoom, Player, Round, RoundScore, Submission, TestCase, as_utc
from app.schemas import RoundIn, TestCaseIn

# No 0/O, 1/I/L: room codes get read aloud across a noisy room.
ROOM_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
ROOM_CODE_LENGTH = 5


class GameError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def _room_query():
    return (
        select(GameRoom)
        .options(
            selectinload(GameRoom.players),
            selectinload(GameRoom.rounds).selectinload(Round.tests),
        )
        .execution_options(populate_existing=True)
    )


async def load_room(s: AsyncSession, code: str) -> GameRoom:
    room = (await s.execute(_room_query().where(GameRoom.room_code == code.upper()))).scalar_one_or_none()
    if room is None:
        raise GameError("Room not found", 404)
    return room


def require_host(room: GameRoom, token: str | None) -> None:
    if not token or not secrets.compare_digest(token, room.host_token):
        raise GameError("Host access required", 403)


def find_player(room: GameRoom, token: str | None) -> Player:
    if token:
        for player in room.players:
            if secrets.compare_digest(player.token, token):
                return player
    raise GameError("You are not in this room", 403)


def active_round(room: GameRoom) -> Round | None:
    return next((r for r in room.rounds if r.status == "active"), None)


def current_round(room: GameRoom) -> Round | None:
    return next((r for r in room.rounds if r.round_number == room.current_round), None)


def clean_name(name: str) -> str:
    name = " ".join(name.split())
    if not 1 <= len(name) <= 20:
        raise GameError("Names are 1-20 characters")
    return name


# ── rooms & players ──────────────────────────────────────────────────────────


async def create_room(s: AsyncSession, name: str, scoring: list[int] | None) -> GameRoom:
    for _ in range(50):
        code = "".join(secrets.choice(ROOM_ALPHABET) for _ in range(ROOM_CODE_LENGTH))
        if await s.scalar(select(GameRoom.id).where(GameRoom.room_code == code)) is None:
            break
    else:  # pragma: no cover - 28M codes, practically unreachable
        raise GameError("Could not allocate a room code", 503)
    room = GameRoom(
        room_code=code,
        name=" ".join(name.split()) or "Game Night",
        host_token=secrets.token_urlsafe(24),
        scoring=list(scoring or DEFAULT_SCORING),
        status="lobby",
        current_round=0,
    )
    s.add(room)
    await s.commit()
    return await load_room(s, code)


async def update_room(s: AsyncSession, room: GameRoom, name: str | None, scoring: list[int] | None) -> None:
    if name is not None:
        room.name = " ".join(name.split()) or room.name
    if scoring is not None:
        room.scoring = list(scoring)
    await s.commit()


async def join_room(
    s: AsyncSession, room: GameRoom, raw_name: str, connected_ids: set[int], max_players: int
) -> Player:
    if room.status == "finished":
        raise GameError("This game is already over", 409)
    name = clean_name(raw_name)
    existing = next((p for p in room.players if p.display_name.lower() == name.lower()), None)
    if existing is not None:
        # Same name + nobody connected under it = the same person on a new device.
        if existing.id in connected_ids:
            raise GameError("That name is taken in this room", 409)
        return existing
    if len(room.players) >= max_players:
        raise GameError("Room is full", 409)
    player = Player(room_id=room.id, display_name=name, token=secrets.token_urlsafe(24), total_points=0)
    s.add(player)
    await s.commit()
    return player


async def kick_player(s: AsyncSession, room: GameRoom, player_id: int) -> None:
    player = next((p for p in room.players if p.id == player_id), None)
    if player is None:
        raise GameError("Player not found", 404)
    await s.delete(player)
    await s.commit()


# ── rounds ───────────────────────────────────────────────────────────────────


def _apply_round(r: Round, data: RoundIn) -> None:
    r.title = data.title.strip()
    r.description = data.description
    r.original_code = data.original_code
    r.duration_seconds = data.duration_seconds
    r.tests = [
        TestCase(position=i, input=t.input, expected_output=t.expected_output, hidden=t.hidden)
        for i, t in enumerate(data.tests)
    ]


def _pending_round(room: GameRoom, round_id: int) -> Round:
    r = next((r for r in room.rounds if r.id == round_id), None)
    if r is None:
        raise GameError("Round not found", 404)
    if r.status != "pending":
        raise GameError("Only upcoming rounds can be changed", 409)
    return r


async def add_round(s: AsyncSession, room: GameRoom, data: RoundIn) -> Round:
    if room.status == "finished":
        raise GameError("This game is already over", 409)
    r = Round(room_id=room.id, round_number=len(room.rounds) + 1, status="pending")
    _apply_round(r, data)
    s.add(r)
    await s.commit()
    return r


async def add_sample_pack(s: AsyncSession, room: GameRoom) -> None:
    number = len(room.rounds)
    for problem in SAMPLE_PACK:
        number += 1
        data = RoundIn(
            title=problem["title"],
            description=problem["description"],
            original_code=problem["original_code"],
            tests=[TestCaseIn(input=i, expected_output=o, hidden=h) for i, o, h in problem["tests"]],
        )
        r = Round(room_id=room.id, round_number=number, status="pending")
        _apply_round(r, data)
        s.add(r)
    await s.commit()


async def update_round(s: AsyncSession, room: GameRoom, round_id: int, data: RoundIn) -> None:
    _apply_round(_pending_round(room, round_id), data)
    await s.commit()


async def delete_round(s: AsyncSession, room: GameRoom, round_id: int) -> None:
    r = _pending_round(room, round_id)
    room.rounds.remove(r)
    # Played rounds always precede pending ones, so their numbers never shift.
    for number, other in enumerate(room.rounds, start=1):
        other.round_number = number
    await s.commit()


async def start_next_round(s: AsyncSession, room: GameRoom, now: datetime, countdown_seconds: int) -> Round:
    if room.status == "finished":
        raise GameError("This game is already over", 409)
    if active_round(room) is not None:
        raise GameError("A round is already running", 409)
    nxt = next((r for r in room.rounds if r.status == "pending"), None)
    if nxt is None:
        raise GameError("No rounds left. Add a problem first.", 409)
    if not nxt.tests:
        raise GameError(f"Round {nxt.round_number} needs at least one test case", 409)
    nxt.status = "active"
    nxt.starts_at = now + timedelta(seconds=countdown_seconds)
    nxt.ends_at = nxt.starts_at + timedelta(seconds=nxt.duration_seconds)
    room.status = "active"
    room.current_round = nxt.round_number
    await s.commit()
    return nxt


async def best_passing(s: AsyncSession, round_id: int) -> dict[int, Submission]:
    """Shortest passing submission per player (earliest wins a same-length tie)."""
    rows = (
        await s.execute(
            select(Submission)
            .where(Submission.round_id == round_id, Submission.passed.is_(True))
            .order_by(Submission.character_count, Submission.submitted_at, Submission.id)
        )
    ).scalars()
    best: dict[int, Submission] = {}
    for sub in rows:
        best.setdefault(sub.player_id, sub)
    return best


async def close_round(s: AsyncSession, room: GameRoom, r: Round, now: datetime) -> bool:
    if r.status != "active":
        return False
    best = await best_passing(s, r.id)
    players = {p.id: p for p in room.players}
    ranked = competition_rank((pid, sub.character_count) for pid, sub in best.items() if pid in players)
    for pid, chars, rank in ranked:
        points = points_for_rank(rank, room.scoring)
        players[pid].total_points += points
        s.add(RoundScore(player_id=pid, round_id=r.id, rank=rank, points=points, best_character_count=chars))
    for pid in players.keys() - best.keys():
        s.add(RoundScore(player_id=pid, round_id=r.id, rank=None, points=0, best_character_count=None))
    r.status = "closed"
    ends_at = as_utc(r.ends_at)
    if ends_at is None or ends_at > now:
        r.ends_at = now  # ended early by the host
    room.status = "results"
    await s.commit()
    return True


async def finish_game(s: AsyncSession, room: GameRoom) -> None:
    if active_round(room) is not None:
        raise GameError("End the current round first", 409)
    room.status = "finished"
    await s.commit()
