from app.game.problems import LIBRARY, STARTER_SLUGS
from tests.test_game_flow import ctx, setup_room, snapshot  # noqa: F401  (fixture)


def test_library_is_well_formed():
    assert len(LIBRARY) >= 20
    for slug, p in LIBRARY.items():
        assert p["slug"] == slug
        assert p["difficulty"] in ("easy", "medium", "hard")
        assert any(not h for *_, h in p["tests"]), f"{slug} needs a public test"
        assert any(h for *_, h in p["tests"]), f"{slug} needs a hidden test"
        assert p["par"] < p["original_chars"], f"{slug} par should beat the original"
    assert all(s in LIBRARY for s in STARTER_SLUGS)


async def test_practice_endpoints(ctx):  # noqa: F811
    _, client = ctx
    listing = (await client.get("/api/practice")).json()["problems"]
    assert len(listing) == len(LIBRARY) and listing[0]["difficulty"] == "easy"

    detail = (await client.get("/api/practice/palindrome")).json()
    assert "par_solution" not in detail and "tests" not in detail
    assert detail["hidden_count"] == 4 and len(detail["public_tests"]) == 3
    assert (await client.get("/api/practice/nope")).status_code == 404

    run = (await client.post("/api/practice/palindrome/run", json={"code": "x"})).json()
    assert run["hidden_total"] == 0 and "par_solution" not in run

    sub = (await client.post("/api/practice/palindrome/submit", json={"code": "s=input()"})).json()
    assert sub["passed"] and sub["hidden_total"] == 4 and sub["par"] == 27
    assert sub["par_solution"] == LIBRARY["palindrome"]["par_solution"]

    bad = (await client.post("/api/practice/palindrome/submit", json={"code": "BAD"})).json()
    assert not bad["passed"] and "par_solution" not in bad


async def test_host_adds_library_rounds(ctx):  # noqa: F811
    app, client = ctx
    code, host, _ = await setup_room(client, players=())
    r = await client.post(f"/api/rooms/{code}/rounds/library", json={"slugs": ["roman", "binary"]}, headers=host)
    assert r.status_code == 201 and r.json() == {"added": 2}
    rounds = (await snapshot(app, code))["host"]["rounds"]
    assert [(x["number"], x["title"]) for x in rounds] == [(1, "Roman Numerals"), (2, "To Binary")]
    assert (await client.post(f"/api/rooms/{code}/rounds/library", json={"slugs": ["nope"]}, headers=host)).status_code == 404
    assert (await client.post(f"/api/rooms/{code}/rounds/library", json={"slugs": ["roman"]})).status_code == 403
