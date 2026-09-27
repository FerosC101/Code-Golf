from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.game import service
from app.game.runtime import GameRuntime
from app.game.service import GameError, load_room, require_host
from app.schemas import CodeIn, CreateRoomIn, JoinIn, LibraryPickIn, RoundIn, UpdateRoomIn

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

Session = Annotated[AsyncSession, Depends(get_session)]
HostToken = Annotated[str | None, Header(alias="X-Host-Token")]
PlayerToken = Annotated[str | None, Header(alias="X-Player-Token")]


def runtime(request: Request) -> GameRuntime:
    return request.app.state.runtime


Runtime = Annotated[GameRuntime, Depends(runtime)]


async def _host_room(s: AsyncSession, code: str, token: str | None):
    room = await load_room(s, code)
    require_host(room, token)
    return room


@router.post("", status_code=201)
async def create_room(body: CreateRoomIn, s: Session):
    room = await service.create_room(s, body.name, body.scoring)
    return {"room_code": room.room_code, "host_token": room.host_token, "name": room.name}


@router.get("/{code}")
async def room_info(code: str, s: Session):
    room = await load_room(s, code)
    return {"room_code": room.room_code, "name": room.name, "status": room.status, "players": len(room.players)}


@router.patch("/{code}")
async def update_room(code: str, body: UpdateRoomIn, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    await service.update_room(s, room, body.name, body.scoring)
    await rt.hub.broadcast_state(room.room_code)
    return {"ok": True}


@router.post("/{code}/join")
async def join_room(code: str, body: JoinIn, s: Session, rt: Runtime):
    room = await load_room(s, code)
    player = await service.join_room(
        s, room, body.name, rt.hub.connected_player_ids(room.room_code), rt.settings.max_players_per_room
    )
    return {
        "room_code": room.room_code,
        "player_id": player.id,
        "player_token": player.token,
        "name": player.display_name,
    }


@router.delete("/{code}/players/{player_id}")
async def kick_player(code: str, player_id: int, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    await service.kick_player(s, room, player_id)
    await rt.hub.disconnect_player(room.room_code, player_id, "Removed by the host.")
    await rt.hub.broadcast_state(room.room_code)
    return {"ok": True}


# ── rounds (host) ─────────────────────────────────────────────────────────────


@router.post("/{code}/rounds", status_code=201)
async def add_round(code: str, body: RoundIn, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    r = await service.add_round(s, room, body)
    await rt.hub.broadcast_state(room.room_code)
    return {"id": r.id}


@router.post("/{code}/rounds/sample-pack", status_code=201)
async def add_sample_pack(code: str, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    await service.add_pack(s, room, "starter")
    await rt.hub.broadcast_state(room.room_code)
    return {"ok": True}


@router.post("/{code}/rounds/pack/{pack}", status_code=201)
async def add_pack(code: str, pack: str, s: Session, rt: Runtime, token: HostToken = None):
    """starter (5 mixed), nightmare (5 very hard), nightmare-full (all 10)."""
    room = await _host_room(s, code, token)
    added = await service.add_pack(s, room, pack)
    await rt.hub.broadcast_state(room.room_code)
    return {"added": added}


@router.post("/{code}/rounds/library", status_code=201)
async def add_library_rounds(code: str, body: LibraryPickIn, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    added = await service.add_library_rounds(s, room, body.slugs)
    await rt.hub.broadcast_state(room.room_code)
    return {"added": added}


@router.put("/{code}/rounds/{round_id}")
async def update_round(code: str, round_id: int, body: RoundIn, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    await service.update_round(s, room, round_id, body)
    await rt.hub.broadcast_state(room.room_code)
    return {"ok": True}


@router.delete("/{code}/rounds/{round_id}")
async def delete_round(code: str, round_id: int, s: Session, rt: Runtime, token: HostToken = None):
    room = await _host_room(s, code, token)
    await service.delete_round(s, room, round_id)
    await rt.hub.broadcast_state(room.room_code)
    return {"ok": True}


@router.post("/{code}/rounds/{round_id}/verify")
async def verify_round(code: str, round_id: int, s: Session, rt: Runtime, token: HostToken = None):
    """Run the original solution against every test so hosts catch typos
    in expected outputs before players do."""
    from app.executor_client import TestSpec

    room = await _host_room(s, code, token)
    r = next((x for x in room.rounds if x.id == round_id), None)
    if r is None:
        raise GameError("Round not found", 404)
    if not r.tests:
        raise GameError("Add at least one test case")
    outcomes = await rt.executor.run(r.original_code, [TestSpec(t.input, t.expected_output, t.hidden) for t in r.tests])
    return {
        "passed": all(o.status == "passed" for o in outcomes),
        "results": [{"status": o.status, "stdout": o.stdout[-400:], "error": o.error[-200:]} for o in outcomes],
    }


@router.post("/{code}/start")
async def start_round(code: str, rt: Runtime, token: HostToken = None):
    await rt.start_round(code.upper(), token)
    return {"ok": True}


@router.post("/{code}/end")
async def end_round(code: str, rt: Runtime, token: HostToken = None):
    await rt.close_round(code.upper(), host_token=token)
    return {"ok": True}


@router.post("/{code}/finish")
async def finish_game(code: str, rt: Runtime, token: HostToken = None):
    await rt.finish_game(code.upper(), token)
    return {"ok": True}


# ── play ──────────────────────────────────────────────────────────────────────


@router.post("/{code}/run")
async def run_code(code: str, body: CodeIn, rt: Runtime, token: PlayerToken = None):
    return await rt.judge(code.upper(), token, body.code, submit=False)


@router.post("/{code}/submit")
async def submit_code(code: str, body: CodeIn, rt: Runtime, token: PlayerToken = None):
    return await rt.judge(code.upper(), token, body.code, submit=True)
