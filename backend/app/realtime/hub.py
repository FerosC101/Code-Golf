"""In-process WebSocket fan-out.

Single-process by design (one uvicorn worker). To scale horizontally, swap
broadcast/emit for Redis pub/sub keyed by room code; the snapshot builder
stays the same."""

import asyncio
import logging
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from fastapi import WebSocket

from app import db
from app.game.service import GameError, load_room
from app.game.snapshot import build_snapshot

log = logging.getLogger(__name__)


def now_ms() -> int:
    return int(time.time() * 1000)


@dataclass(eq=False)
class Connection:
    ws: WebSocket
    role: str  # host | player | spectator
    player_id: int | None = None


class Hub:
    def __init__(self) -> None:
        self.rooms: dict[str, set[Connection]] = defaultdict(set)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    def connected_player_ids(self, code: str) -> set[int]:
        return {c.player_id for c in self.rooms.get(code, ()) if c.player_id is not None}

    def add(self, code: str, conn: Connection) -> None:
        self.rooms[code].add(conn)

    def remove(self, code: str, conn: Connection) -> None:
        conns = self.rooms.get(code)
        if conns is not None:
            conns.discard(conn)
            if not conns:
                self.rooms.pop(code, None)

    async def _send(self, code: str, conn: Connection, message: dict[str, Any]) -> None:
        try:
            await asyncio.wait_for(conn.ws.send_json(message), timeout=5)
        except Exception:  # noqa: BLE001 - dead socket, drop it
            self.remove(code, conn)

    async def broadcast_state(self, code: str) -> None:
        # Serialised per room so clients never receive an older state after a newer one.
        async with self._locks[code]:
            conns = list(self.rooms.get(code, ()))
            if not conns:
                return
            try:
                async with db.session() as s:
                    room = await load_room(s, code)
                    snap = await build_snapshot(s, room, self.connected_player_ids(code))
            except GameError:
                return
            server_now = now_ms()
            await asyncio.gather(
                *(
                    self._send(code, c, {"type": "state", "server_now": server_now, **snap.for_viewer(c.role, c.player_id)})
                    for c in conns
                )
            )

    async def emit(self, code: str, kind: str, text: str, **extra: Any) -> None:
        message = {"type": "event", "kind": kind, "text": text, "at": now_ms(), **extra}
        await asyncio.gather(*(self._send(code, c, message) for c in list(self.rooms.get(code, ()))))

    async def disconnect_player(self, code: str, player_id: int, reason: str) -> None:
        for conn in list(self.rooms.get(code, ())):
            if conn.player_id == player_id:
                await self._send(code, conn, {"type": "kicked", "text": reason})
                self.remove(code, conn)
                try:
                    await conn.ws.close(code=4403)
                except Exception:  # noqa: BLE001
                    pass
