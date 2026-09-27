from fastapi import APIRouter, Request

from app.game.problems import DIFFICULTIES, LIBRARY
from app.game.service import GameError
from app.schemas import CodeIn

router = APIRouter(prefix="/api/practice", tags=["practice"])


def _summary(p: dict) -> dict:
    return {
        "slug": p["slug"],
        "title": p["title"],
        "difficulty": p["difficulty"],
        "description": p["description"],
        "original_chars": p["original_chars"],
        "par": p["par"],
    }


@router.get("")
async def list_problems():
    """The problem library, easiest first. Also powers the host's picker."""
    order = {d: i for i, d in enumerate(DIFFICULTIES)}
    problems = sorted(LIBRARY.values(), key=lambda p: order[p["difficulty"]])
    return {"problems": [_summary(p) for p in problems]}


@router.get("/{slug}")
async def get_problem(slug: str):
    p = LIBRARY.get(slug)
    if p is None:
        raise GameError("Problem not found", 404)
    # Hidden tests and the par solution never leave the server here.
    return {
        **_summary(p),
        "original_code": p["original_code"],
        "public_tests": [{"input": i, "expected_output": o} for i, o, h in p["tests"] if not h],
        "hidden_count": sum(1 for *_, h in p["tests"] if h),
    }


@router.post("/{slug}/run")
async def run(slug: str, body: CodeIn, request: Request):
    return await request.app.state.runtime.practice(slug, body.code, submit=False)


@router.post("/{slug}/submit")
async def submit(slug: str, body: CodeIn, request: Request):
    return await request.app.state.runtime.practice(slug, body.code, submit=True)
