import asyncio
import json
import os
import shutil
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.config import Settings

SANDBOX_DIR = Path(__file__).resolve().parent.parent / "sandbox"


@dataclass
class RawResult:
    exit: int | None
    timeout: bool
    stdout: str
    stderr: str


class SandboxError(Exception):
    pass


async def _communicate(proc: asyncio.subprocess.Process, payload: bytes, deadline: float) -> bytes:
    try:
        stdout, _ = await asyncio.wait_for(proc.communicate(payload), timeout=deadline)
    except TimeoutError:
        proc.kill()
        await proc.wait()
        raise
    if proc.returncode != 0:
        raise SandboxError(f"sandbox exited with {proc.returncode}")
    return stdout


def _parse(stdout: bytes, n: int) -> list[RawResult]:
    try:
        rows = json.loads(stdout)
    except ValueError as exc:
        raise SandboxError("sandbox returned garbage") from exc
    if len(rows) != n:
        raise SandboxError("sandbox returned wrong number of results")
    return [RawResult(r.get("exit"), bool(r.get("timeout")), r.get("stdout", ""), r.get("stderr", "")) for r in rows]


class Sandbox:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._slots = asyncio.Semaphore(settings.max_concurrency)

    def _job(self, code: str, inputs: list[str], time_limit: float) -> bytes:
        return json.dumps(
            {"code": code, "inputs": inputs, "time_limit": time_limit, "memory_mb": self.settings.memory_mb}
        ).encode()

    async def run(self, code: str, inputs: list[str], time_limit: float) -> list[RawResult]:
        # Whole-job wall clock: per-test limit plus interpreter/container startup.
        deadline = len(inputs) * (time_limit + 0.5) + 10
        async with self._slots:
            if self.settings.mode == "process":
                return await self._run_process(code, inputs, time_limit, deadline)
            return await self._run_docker(code, inputs, time_limit, deadline)

    async def _run_docker(self, code: str, inputs: list[str], time_limit: float, deadline: float) -> list[RawResult]:
        s = self.settings
        name = f"cg-run-{uuid.uuid4().hex[:12]}"
        cmd = [
            "docker", "run", "--rm", "-i", "--name", name,
            "--network", "none",
            "--memory", f"{s.memory_mb}m", "--memory-swap", f"{s.memory_mb}m",
            "--cpus", s.cpus,
            "--pids-limit", str(s.pids_limit),
            "--read-only",
            "--tmpfs", f"/tmp:rw,nosuid,nodev,size={s.tmpfs_mb}m",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "--ulimit", "nofile=64:64",
            "--ulimit", "fsize=1048576:1048576",
            "--log-driver", "none",
            s.sandbox_image,
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL
        )
        try:
            out = await _communicate(proc, self._job(code, inputs, time_limit), deadline)
        except TimeoutError as exc:
            await (await asyncio.create_subprocess_exec(
                "docker", "rm", "-f", name, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL
            )).wait()
            raise SandboxError("sandbox wall clock exceeded") from exc
        return _parse(out, len(inputs))

    async def _run_process(self, code: str, inputs: list[str], time_limit: float, deadline: float) -> list[RawResult]:
        workdir = tempfile.mkdtemp(prefix="cg-run-")
        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-I", "-B", str(SANDBOX_DIR / "runner.py"),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
                cwd=workdir,
                env={"CG_WORKDIR": workdir, "PATH": os.environ.get("PATH", "/usr/bin:/bin")},
            )
            try:
                out = await _communicate(proc, self._job(code, inputs, time_limit), deadline)
            except TimeoutError as exc:
                raise SandboxError("sandbox wall clock exceeded") from exc
            return _parse(out, len(inputs))
        finally:
            shutil.rmtree(workdir, ignore_errors=True)
