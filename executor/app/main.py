"""Execution service. Internal only: reachable from the game backend, never
from the internet. Returns a verdict per test and nothing about the host."""

import logging
import secrets

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.judge import verdict
from app.sandbox import Sandbox, SandboxError

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("executor")

settings = get_settings()
sandbox = Sandbox(settings)
app = FastAPI(title="Code Golf Executor", docs_url=None, redoc_url=None, openapi_url=None)


class TestIn(BaseModel):
    input: str = Field(default="", max_length=20_000)
    expected_output: str = Field(default="", max_length=20_000)


class ExecuteIn(BaseModel):
    code: str = Field(max_length=20_000)
    tests: list[TestIn] = Field(min_length=1, max_length=50)
    time_limit: float = Field(default=2.0, gt=0)


@app.get("/health")
async def health():
    return {"ok": True, "mode": settings.mode}


@app.post("/execute")
async def execute(body: ExecuteIn, x_executor_token: str | None = Header(default=None)):
    if not x_executor_token or not secrets.compare_digest(x_executor_token, settings.token):
        raise HTTPException(status_code=401, detail="unauthorized")
    time_limit = min(body.time_limit, settings.max_time_limit)
    try:
        raw = await sandbox.run(body.code, [t.input for t in body.tests], time_limit)
    except SandboxError:
        log.exception("sandbox failure")
        raise HTTPException(status_code=503, detail="sandbox unavailable") from None
    return {"results": [verdict(r, t.expected_output) for r, t in zip(raw, body.tests, strict=True)]}
