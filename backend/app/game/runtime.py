"""Orchestrates the live game: per-room locks, round timers, judging, and
broadcasting. The server clock is the only clock that matters."""

import asyncio
import logging
from collections import defaultdict
from datetime import timedelta
from typing import Any

from sqlalchemy import func, select

from app import db
from app.config import Settings
from app.executor_client import Executor, TestOutcome, TestSpec
from app.game import service
from app.game.problems import LIBRARY
from app.game.scoring import count_chars, normalize_code
from app.game.service import GameError, active_round, find_player, load_room, require_host
from app.models import GameRoom, Round, Submission, as_utc, utcnow
from app.realtime.hub import Hub

log = logging.getLogger(__name__)


def _tail(text: str, limit: int) -> str:
    text = text.strip()
    return text if len(text) <= limit else "…" + text[-limit:]


def summarize(tests: list[TestSpec], outcomes: list[TestOutcome]) -> dict[str, Any]:
    """Player-facing verdict: details for public tests, only counts for hidden ones."""
    if len(outcomes) != len(tests):
        raise GameError("The judge returned an unexpected result", 502)
    public: list[dict[str, Any]] = []
    hidden_total = hidden_passed = 0
    for index, (spec, outcome) in enumerate(zip(tests, outcomes, strict=True)):
        if spec.hidden:
            hidden_total += 1
            hidden_passed += outcome.status == "passed"
        else:
            # Public tests: show the player's own output to help debugging.
            public.append(
                {
                    "index": index,
                    "status": outcome.status,
                    "stdout": _tail(outcome.stdout, 400),
                    "error": _tail(outcome.error, 200),
                }
            )
    return {
        "passed": all(o.status == "passed" for o in outcomes),
        "public": public,
        "hidden_total": hidden_total,
        "hidden_passed": hidden_passed,
        "failed": sum(o.status != "passed" for o in outcomes),
    }


def clean_source(source: str, max_chars: int) -> tuple[str, int]:
    source = normalize_code(source)
    chars = count_chars(source)
    if not source.strip():
        raise GameError("Write some code first")
    if chars > max_chars:
        raise GameError("That's not golf, that's a novel")
    return source, chars


class GameRuntime:
    def __init__(self, settings: Settings, executor: Executor, hub: Hub):
        self.settings = settings
        self.executor = executor
        self.hub = hub
        self._room_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._timers: dict[int, asyncio.Task] = {}
        self._locked_rounds: set[int] = set()
        self._inflight: dict[int, set[asyncio.Task]] = defaultdict(set)
        self._busy_players: set[int] = set()
        # Solo practice shares the executor with live games; cap it so a crowd
        # of practisers can't slow down judging during a round.
        self._practice_slots = asyncio.Semaphore(max(1, settings.practice_concurrency))

    # ── lifecycle ─────────────────────────────────────────────────────────

    async def resume(self) -> None:
        """Re-arm timers for rounds that were live when the server restarted."""
        async with db.session() as s:
            rows = (
                await s.execute(
                    select(GameRoom.room_code, Round.id, Round.ends_at)
                    .join(Round, Round.room_id == GameRoom.id)
                    .where(Round.status == "active")
                )
            ).all()
        for code, round_id, ends_at in rows:
            self._schedule_close(code, round_id, as_utc(ends_at))

    async def shutdown(self) -> None:
        for task in self._timers.values():
            task.cancel()
        self._timers.clear()

    def _schedule_close(self, code: str, round_id: int, ends_at) -> None:
        async def fire() -> None:
            delay = (ends_at - utcnow()).total_seconds() + self.settings.submit_grace_seconds
            if delay > 0:
                await asyncio.sleep(delay)
            try:
                await self.close_round(code, round_id=round_id)
            except Exception:  # noqa: BLE001
                log.exception("Failed to close round %s in %s", round_id, code)

        self._timers[round_id] = asyncio.create_task(fire(), name=f"round-timer-{round_id}")

    # ── host actions ──────────────────────────────────────────────────────

    async def start_round(self, code: str, host_token: str | None) -> None:
        async with self._room_locks[code]:
            async with db.session() as s:
                room = await load_room(s, code)
                require_host(room, host_token)
                r = await service.start_next_round(s, room, utcnow(), self.settings.countdown_seconds)
                round_id, number, ends_at = r.id, r.round_number, as_utc(r.ends_at)
            self._schedule_close(code, round_id, ends_at)
        await self.hub.broadcast_state(code)
        await self.hub.emit(code, "round", f"loading round_{number:02d}.py")

    async def close_round(self, code: str, *, round_id: int | None = None, host_token: str | None = None) -> None:
        async with self._room_locks[code]:
            async with db.session() as s:
                room = await load_room(s, code)
                if host_token is not None:
                    require_host(room, host_token)
                r = active_round(room)
                if r is None or (round_id is not None and r.id != round_id):
                    if host_token is not None:
                        raise GameError("No round is running", 409)
                    return
                round_id = r.id
                self._locked_rounds.add(round_id)

            await self.hub.emit(code, "locked", "submissions locked.")
            pending = list(self._inflight.get(round_id, ()))
            if pending:
                await asyncio.wait(pending, timeout=self.settings.lock_drain_seconds)

            async with db.session() as s:
                room = await load_room(s, code)
                r = next(x for x in room.rounds if x.id == round_id)
                await service.close_round(s, room, r, utcnow())

            timer = self._timers.pop(round_id, None)
            if timer is not None and timer is not asyncio.current_task():
                timer.cancel()
            self._locked_rounds.discard(round_id)
            self._inflight.pop(round_id, None)
        await self.hub.broadcast_state(code)
        await self.hub.emit(code, "results", f"round_{r.round_number:02d} results ready.")

    async def finish_game(self, code: str, host_token: str | None) -> None:
        async with db.session() as s:
            room = await load_room(s, code)
            require_host(room, host_token)
            running = active_round(room) is not None
        if running:
            await self.close_round(code, host_token=host_token)
        async with self._room_locks[code]:
            async with db.session() as s:
                room = await load_room(s, code)
                await service.finish_game(s, room)
        await self.hub.broadcast_state(code)
        await self.hub.emit(code, "champion", "champion detected.")

    # ── player actions ────────────────────────────────────────────────────

    async def judge(self, code: str, player_token: str | None, source: str, *, submit: bool) -> dict[str, Any]:
        source, chars = clean_source(source, self.settings.max_code_chars)

        async with db.session() as s:
            room = await load_room(s, code)
            player = find_player(room, player_token)
            r = active_round(room)
            now = utcnow()
            if r is None:
                raise GameError("No round is running", 409)
            if now < as_utc(r.starts_at):
                raise GameError("Round hasn't started yet", 409)
            if r.id in self._locked_rounds or now > as_utc(r.ends_at) + timedelta(
                seconds=self.settings.submit_grace_seconds
            ):
                raise GameError("Submissions are locked", 409)
            tests = [TestSpec(t.input, t.expected_output, t.hidden) for t in r.tests if submit or not t.hidden]
            round_id, player_id, player_name = r.id, player.id, player.display_name

        if player_id in self._busy_players:
            raise GameError("Still judging your last run", 429)
        self._busy_players.add(player_id)
        try:
            task = asyncio.create_task(self._judge_and_record(source, chars, tests, round_id, player_id, submit))
            if submit:
                # Registered before the lock check so close_round() either
                # sees this task and waits for it, or we see the lock.
                self._inflight[round_id].add(task)
                if round_id in self._locked_rounds:
                    task.cancel()
                    self._inflight[round_id].discard(task)
                    raise GameError("Submissions are locked", 409)
            # shield: a client disconnect must not cancel a submission mid-record.
            result = await asyncio.shield(task)
        finally:
            self._busy_players.discard(player_id)
            if submit:
                self._inflight.get(round_id, set()).discard(task)

        if submit:
            await self.hub.broadcast_state(code)
            verb = "posted a valid solution" if result["passed"] else "submitted. tests failed"
            await self.hub.emit(code, "submission", f"{player_name} {verb}", player=player_name, passed=result["passed"])
        return result

    async def _judge_and_record(
        self, source: str, chars: int, tests: list[TestSpec], round_id: int, player_id: int, submit: bool
    ) -> dict[str, Any]:
        outcomes: list[TestOutcome] = await self.executor.run(source, tests)
        result: dict[str, Any] = {"chars": chars, **summarize(tests, outcomes)}
        passed = result["passed"]
        if submit:
            async with db.session() as s:
                previous_best = await s.scalar(
                    select(func.min(Submission.character_count)).where(
                        Submission.round_id == round_id,
                        Submission.player_id == player_id,
                        Submission.passed.is_(True),
                    )
                )
                s.add(Submission(player_id=player_id, round_id=round_id, code=source, character_count=chars, passed=passed))
                await s.commit()
            best = previous_best
            if passed:
                best = chars if previous_best is None else min(previous_best, chars)
            result |= {"submitted": True, "previous_best": previous_best, "best": best}
        return result

    # ── solo practice (stateless: personal bests live in the browser) ──────

    async def practice(self, slug: str, source: str, *, submit: bool) -> dict[str, Any]:
        problem = LIBRARY.get(slug)
        if problem is None:
            raise GameError("Problem not found", 404)
        source, chars = clean_source(source, self.settings.max_code_chars)
        tests = [TestSpec(i, o, h) for i, o, h in problem["tests"] if submit or not h]
        try:
            await asyncio.wait_for(self._practice_slots.acquire(), timeout=15)
        except TimeoutError:
            raise GameError("Practice judge is busy. Try again in a few seconds.", 429) from None
        try:
            outcomes = await self.executor.run(source, tests)
        finally:
            self._practice_slots.release()
        result: dict[str, Any] = {"chars": chars, **summarize(tests, outcomes), "par": problem["par"]}
        if submit and result["passed"]:
            # Earned it: show how par was reached.
            result["par_solution"] = problem["par_solution"]
        return result
