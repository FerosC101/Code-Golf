import asyncio

import httpx
import pytest
from sqlalchemy import update

from app import db
from app.config import Settings
from app.executor_client import TestOutcome
from app.main import create_app
from app.models import Round


class FakeExecutor:
    """Passes everything unless the code contains BAD. SLOW sleeps first."""

    async def run(self, code, tests):
        if "SLOW" in code:
            await asyncio.sleep(0.3)
        status = "failed" if "BAD" in code else "passed"
        return [TestOutcome(status=status, stdout="out") for _ in tests]


ROUND = {
    "title": "Palindrome",
    "description": "d",
    "original_code": "s = input()\nprint(s == s[::-1])\n",
    "duration_seconds": 60,
    "tests": [
        {"input": "aba", "expected_output": "True", "hidden": False},
        {"input": "ab", "expected_output": "False", "hidden": True},
    ],
}


@pytest.fixture
async def ctx(tmp_path):
    settings = Settings(database_url=f"sqlite+aiosqlite:///{tmp_path}/t.db", countdown_seconds=0)
    app = create_app(settings, executor=FakeExecutor())
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://t") as client:
            yield app, client


async def setup_room(client, players=("Vince", "Ian", "Aila", "Marco")):
    room = (await client.post("/api/rooms", json={"name": "Night"})).json()
    code, host = room["room_code"], {"X-Host-Token": room["host_token"]}
    tokens = {}
    for name in players:
        r = await client.post(f"/api/rooms/{code}/join", json={"name": name})
        assert r.status_code == 200, r.text
        tokens[name] = {"X-Player-Token": r.json()["player_token"]}
    return code, host, tokens


async def snapshot(app, code, role="host", player_id=None):
    from app.game.service import load_room
    from app.game.snapshot import build_snapshot

    async with db.session() as s:
        room = await load_room(s, code)
        return (await build_snapshot(s, room, set())).for_viewer(role, player_id)


async def test_full_game(ctx):
    app, client = ctx
    code, host, p = await setup_room(client)
    assert (await client.post(f"/api/rooms/{code}/rounds", json=ROUND, headers=host)).status_code == 201
    assert (await client.post(f"/api/rooms/{code}/rounds", json=ROUND, headers=host)).status_code == 201

    # players can't host, hosts can't be skipped
    assert (await client.post(f"/api/rooms/{code}/start", headers=p["Ian"])).status_code == 403
    assert (await client.post(f"/api/rooms/{code}/start", headers=host)).status_code == 200

    # hidden tests never reach players
    snap = await snapshot(app, code, role="player")
    assert len(snap["round"]["public_tests"]) == 1 and "host" not in snap
    assert "False" not in str(snap["round"]["public_tests"]) and "tests" not in snap["round"]

    run = (await client.post(f"/api/rooms/{code}/run", json={"code": "x"}, headers=p["Vince"])).json()
    assert run["hidden_total"] == 0 and len(run["public"]) == 1 and "submitted" not in run

    async def submit(name, src):
        r = await client.post(f"/api/rooms/{code}/submit", json={"code": src}, headers=p[name])
        assert r.status_code == 200, r.text
        return r.json()

    first = await submit("Vince", "x" * 31)
    assert first["passed"] and first["best"] == 31 and first["previous_best"] is None
    better = await submit("Vince", "x" * 24)
    assert (better["previous_best"], better["best"]) == (31, 24)
    await submit("Ian", "x" * 27)
    await submit("Aila", "x" * 27)  # same length as Ian, but later
    bad = await submit("Marco", "BAD")
    assert not bad["passed"] and bad["hidden_total"] == 1 and bad["hidden_passed"] == 0

    assert (await client.post(f"/api/rooms/{code}/end", headers=host)).status_code == 200
    locked = await client.post(f"/api/rooms/{code}/submit", json={"code": "x"}, headers=p["Ian"])
    assert locked.status_code == 409

    snap = await snapshot(app, code)
    entries = {e["name"]: e for e in snap["results"]["entries"]}
    assert (entries["Vince"]["rank"], entries["Vince"]["points"], entries["Vince"]["chars"]) == (1, 10, 24)
    # Tie on length → Ian submitted first, so Ian places above Aila.
    assert (entries["Ian"]["rank"], entries["Ian"]["points"]) == (2, 8)
    assert (entries["Aila"]["rank"], entries["Aila"]["points"]) == (3, 6)
    assert entries["Ian"]["time_ms"] <= entries["Aila"]["time_ms"]
    assert [e["name"] for e in snap["results"]["entries"][:3]] == ["Vince", "Ian", "Aila"]
    assert (entries["Marco"]["rank"], entries["Marco"]["points"], entries["Marco"]["status"]) == (None, 0, "failed")
    assert snap["results"]["shortest"] == {"name": "Vince", "code": "x" * 24, "chars": 24}
    assert snap["room"]["status"] == "results"

    # round 2: Marco wins, movement indicators appear
    await client.post(f"/api/rooms/{code}/start", headers=host)
    await submit("Marco", "x" * 5)
    await submit("Vince", "x" * 50)
    await client.post(f"/api/rooms/{code}/end", headers=host)
    snap = await snapshot(app, code)
    board = {e["name"]: e for e in snap["leaderboard"]}
    assert board["Vince"]["points"] == 18 and board["Vince"]["rank"] == 1 and board["Vince"]["movement"] == 0
    assert board["Marco"]["points"] == 10 and board["Marco"]["movement"] == 2  # 4th -> 2nd
    assert board["Ian"]["movement"] == -1 and board["Ian"]["rank"] == 3  # 2nd -> 3rd
    assert board["Aila"]["movement"] == -1 and board["Aila"]["rank"] == 4  # 3rd -> 4th

    no_more = await client.post(f"/api/rooms/{code}/start", headers=host)
    assert no_more.status_code == 409
    assert (await client.post(f"/api/rooms/{code}/finish", headers=host)).status_code == 200
    assert (await snapshot(app, code))["room"]["status"] == "finished"


async def test_timer_locks_and_drains_inflight(ctx):
    app, client = ctx
    code, host, p = await setup_room(client, players=("Vince",))
    await client.post(f"/api/rooms/{code}/rounds", json=ROUND, headers=host)
    async with db.session() as s:
        await s.execute(update(Round).values(duration_seconds=1))
        await s.commit()
    app.state.runtime.settings.submit_grace_seconds = 0.2
    await client.post(f"/api/rooms/{code}/start", headers=host)

    # a slow submission sent before the buzzer still counts
    slow = asyncio.create_task(
        client.post(f"/api/rooms/{code}/submit", json={"code": "SLOW"}, headers=p["Vince"])
    )
    await asyncio.sleep(1.4)
    assert (await slow).status_code == 200
    snap = await snapshot(app, code)
    assert snap["room"]["status"] == "results"
    assert snap["results"]["entries"][0]["chars"] == 4


async def test_names_and_kicks(ctx):
    app, client = ctx
    code, host, p = await setup_room(client, players=("Vince",))
    # disconnected name can be reclaimed on a new device
    again = await client.post(f"/api/rooms/{code}/join", json={"name": "  vince "})
    assert again.status_code == 200 and again.json()["player_token"] == p["Vince"]["X-Player-Token"]
    assert (await client.post(f"/api/rooms/{code}/join", json={"name": " "})).status_code == 400
    assert (await client.get("/api/rooms/NOPE0")).status_code == 404
    pid = again.json()["player_id"]
    assert (await client.delete(f"/api/rooms/{code}/players/{pid}", headers=host)).status_code == 200
    assert (await client.get(f"/api/rooms/{code}")).json()["players"] == 0


async def test_host_round_editing(ctx):
    app, client = ctx
    code, host, _ = await setup_room(client, players=())
    await client.post(f"/api/rooms/{code}/rounds/sample-pack", headers=host)
    snap = await snapshot(app, code)
    rounds = snap["host"]["rounds"]
    assert len(rounds) == 5 and rounds[0]["title"] == "Palindrome Checker"
    assert (await client.delete(f"/api/rooms/{code}/rounds/{rounds[1]['id']}", headers=host)).status_code == 200
    snap = await snapshot(app, code)
    assert [r["number"] for r in snap["host"]["rounds"]] == [1, 2, 3, 4]
    edited = dict(ROUND, title="Edited")
    r = await client.put(f"/api/rooms/{code}/rounds/{rounds[0]['id']}", json=edited, headers=host)
    assert r.status_code == 200
    assert (await snapshot(app, code))["host"]["rounds"][0]["title"] == "Edited"
