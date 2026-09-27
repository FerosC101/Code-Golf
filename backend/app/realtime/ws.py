import secrets

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app import db
from app.game.service import GameError, load_room
from app.realtime.hub import Connection, now_ms

router = APIRouter()


@router.websocket("/ws/rooms/{code}")
async def room_socket(websocket: WebSocket, code: str, token: str | None = None):
    hub = websocket.app.state.runtime.hub
    code = code.upper()
    await websocket.accept()

    try:
        async with db.session() as s:
            room = await load_room(s, code)
            role, player_id = "spectator", None
            if token and secrets.compare_digest(token, room.host_token):
                role = "host"
            elif token:
                player = next((p for p in room.players if secrets.compare_digest(p.token, token)), None)
                if player is None:
                    await websocket.send_json({"type": "kicked", "text": "You are not in this room."})
                    await websocket.close(code=4403)
                    return
                role, player_id = "player", player.id
    except GameError:
        await websocket.send_json({"type": "error", "text": "Room not found"})
        await websocket.close(code=4404)
        return

    conn = Connection(ws=websocket, role=role, player_id=player_id)
    hub.add(code, conn)
    await hub.broadcast_state(code)
    try:
        while True:
            message = await websocket.receive_json()
            if isinstance(message, dict) and message.get("type") == "ping":
                # Clock sync: client computes offset = server - (t0 + rtt/2).
                await websocket.send_json({"type": "pong", "t": message.get("t"), "server_now": now_ms()})
    except (WebSocketDisconnect, RuntimeError, ValueError):
        pass
    finally:
        hub.remove(code, conn)
        await hub.broadcast_state(code)
