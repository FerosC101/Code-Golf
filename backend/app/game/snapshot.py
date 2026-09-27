"""Builds the room state pushed over WebSockets.

One snapshot is built per broadcast, then tailored per viewer: hosts get
hidden tests and every submission, players get their own stats, and nobody
else ever sees hidden test data or other players' code (until the results
screen reveals the winning solution)."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.game.scoring import competition_rank, count_chars
from app.game.service import best_passing, current_round
from app.models import GameRoom, Round, RoundScore, Submission, as_utc


def ms(dt: datetime | None) -> int | None:
    dt = as_utc(dt)
    return None if dt is None else int(dt.timestamp() * 1000)


def _round_public(r: Round) -> dict[str, Any]:
    return {
        "id": r.id,
        "number": r.round_number,
        "title": r.title,
        "description": r.description,
        "original_code": r.original_code,
        "original_chars": count_chars(r.original_code),
        "duration_seconds": r.duration_seconds,
        "status": r.status,
        "starts_at": ms(r.starts_at),
        "ends_at": ms(r.ends_at),
        "public_tests": [
            {"input": t.input, "expected_output": t.expected_output} for t in r.tests if not t.hidden
        ],
    }


def _round_host(r: Round) -> dict[str, Any]:
    data = _round_public(r)
    data["tests"] = [
        {"input": t.input, "expected_output": t.expected_output, "hidden": t.hidden} for t in r.tests
    ]
    return data


@dataclass
class Snapshot:
    base: dict[str, Any]
    host: dict[str, Any]
    me: dict[int, dict[str, Any]] = field(default_factory=dict)

    def for_viewer(self, role: str, player_id: int | None) -> dict[str, Any]:
        payload = dict(self.base, role=role)
        if role == "host":
            payload["host"] = self.host
        elif role == "player" and player_id is not None:
            payload["me"] = self.me.get(player_id)
        return payload


async def build_snapshot(s: AsyncSession, room: GameRoom, connected: set[int]) -> Snapshot:
    names = {p.id: p.display_name for p in room.players}
    cur = current_round(room)

    subs: list[Submission] = []
    if cur is not None:
        subs = list(
            (
                await s.execute(
                    select(Submission).where(Submission.round_id == cur.id).order_by(Submission.submitted_at)
                )
            ).scalars()
        )
    attempts: dict[int, int] = {}
    best: dict[int, int] = {}
    for sub in subs:
        attempts[sub.player_id] = attempts.get(sub.player_id, 0) + 1
        if sub.passed:
            best[sub.player_id] = min(best.get(sub.player_id, sub.character_count), sub.character_count)

    # ── leaderboard with movement relative to the previous closed round ──
    closed = [r for r in room.rounds if r.status == "closed"]
    last_closed = closed[-1] if closed else None
    last_points: dict[int, int] = {}
    if last_closed is not None and len(closed) >= 2:
        rows = await s.execute(
            select(RoundScore.player_id, RoundScore.points).where(RoundScore.round_id == last_closed.id)
        )
        last_points = {pid: pts for pid, pts in rows.all()}
    ranked = competition_rank(((p.id, p.total_points) for p in room.players), reverse=True)
    prev_rank: dict[int, int] = {}
    if last_points:
        prev = competition_rank(
            ((p.id, p.total_points - last_points.get(p.id, 0)) for p in room.players), reverse=True
        )
        prev_rank = {pid: rank for pid, _, rank in prev}
    leaderboard = [
        {
            "player_id": pid,
            "name": names[pid],
            "points": pts,
            "rank": rank,
            "movement": (prev_rank[pid] - rank) if pid in prev_rank else None,
        }
        for pid, pts, rank in ranked
    ]

    # ── results for the round that just closed ──
    results = None
    if cur is not None and cur.status == "closed":
        scores = (await s.execute(select(RoundScore).where(RoundScore.round_id == cur.id))).scalars().all()
        winners = await best_passing(s, cur.id)
        entries = []
        for sc in scores:
            if sc.player_id not in names:
                continue
            status = "valid" if sc.rank else ("failed" if attempts.get(sc.player_id) else "none")
            entries.append(
                {
                    "player_id": sc.player_id,
                    "name": names[sc.player_id],
                    "rank": sc.rank,
                    "points": sc.points,
                    "chars": sc.best_character_count,
                    "status": status,
                }
            )
        entries.sort(key=lambda e: (e["rank"] is None, e["rank"] or 0, e["status"] != "failed", e["name"].lower()))
        shortest = None
        if winners:
            top = min(winners.values(), key=lambda w: (w.character_count, w.submitted_at, w.id))
            shortest = {"name": names.get(top.player_id, "?"), "code": top.code, "chars": top.character_count}
        results = {
            "round_number": cur.round_number,
            "title": cur.title,
            "original_chars": count_chars(cur.original_code),
            "entries": entries,
            "shortest": shortest,
        }

    pending_left = sum(1 for r in room.rounds if r.status == "pending")
    base = {
        "room": {
            "code": room.room_code,
            "name": room.name,
            "status": room.status,
            "current_round": room.current_round,
            "total_rounds": len(room.rounds),
            "rounds_left": pending_left,
            "scoring": room.scoring,
        },
        "players": [
            {
                "id": p.id,
                "name": p.display_name,
                "points": p.total_points,
                "connected": p.id in connected,
                "attempts": attempts.get(p.id, 0),
                "valid": p.id in best,
            }
            for p in room.players
        ],
        "round": _round_public(cur) if cur is not None else None,
        "results": results,
        "leaderboard": leaderboard,
    }
    host = {
        "rounds": [_round_host(r) for r in room.rounds],
        "submissions": [
            {
                "id": sub.id,
                "player_id": sub.player_id,
                "name": names.get(sub.player_id, "?"),
                "chars": sub.character_count,
                "passed": sub.passed,
                "code": sub.code,
                "submitted_at": ms(sub.submitted_at),
            }
            for sub in reversed(subs)
        ],
        "best": {str(pid): chars for pid, chars in best.items()},
    }
    me = {
        p.id: {
            "player_id": p.id,
            "name": p.display_name,
            "points": p.total_points,
            "best_chars": best.get(p.id),
            "attempts": attempts.get(p.id, 0),
        }
        for p in room.players
    }
    return Snapshot(base=base, host=host, me=me)
