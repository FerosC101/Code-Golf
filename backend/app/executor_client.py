"""Talks to the isolated execution service. Participant code never runs in
this process."""

from dataclasses import dataclass
from typing import Protocol

import httpx

from app.game.service import GameError


@dataclass
class TestSpec:
    input: str
    expected_output: str
    hidden: bool


@dataclass
class TestOutcome:
    status: str  # passed | failed | timeout | runtime_error
    stdout: str = ""
    error: str = ""


class Executor(Protocol):
    async def run(self, code: str, tests: list[TestSpec]) -> list[TestOutcome]: ...


class HttpExecutor:
    def __init__(self, base_url: str, token: str, time_limit: float):
        self._client = httpx.AsyncClient(base_url=base_url, timeout=httpx.Timeout(90.0, connect=5.0))
        self._token = token
        self._time_limit = time_limit

    async def run(self, code: str, tests: list[TestSpec]) -> list[TestOutcome]:
        try:
            response = await self._client.post(
                "/execute",
                headers={"X-Executor-Token": self._token},
                json={
                    "code": code,
                    "time_limit": self._time_limit,
                    "tests": [{"input": t.input, "expected_output": t.expected_output} for t in tests],
                },
            )
            response.raise_for_status()
            results = response.json()["results"]
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            raise GameError("The judge is unavailable. Try again in a moment.", 503) from exc
        return [
            TestOutcome(status=r.get("status", "runtime_error"), stdout=r.get("stdout", ""), error=r.get("error", ""))
            for r in results
        ]

    async def aclose(self) -> None:
        await self._client.aclose()
