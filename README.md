# >_ CODE GOLF

**MAKE IT SHORTER. MAKE IT WORK.**

Live Python code-golf competitions for community game nights. The host queues up problems, everyone gets the same working solution at the same moment, and the shortest passing rewrite wins the round.

```
s=input();print(s==s[::-1])      # 27 chars. every one counts.
```

## Run it

### Production-style (Docker)

```bash
cp .env.example .env        # change EXECUTOR_TOKEN and POSTGRES_PASSWORD
docker compose up --build
open http://localhost:8080
```

This starts Postgres, the game server, the isolated execution service, and nginx serving the built frontend. The first build also builds `codegolf-sandbox:latest`, the throwaway image each submission runs in.

### Deploy: frontend on Vercel, backend on Render

Vercel hosts only the frontend: the backend keeps WebSockets open for a whole game and runs round timers in memory, which serverless functions can't do.

**1. Render (backend, executor, Postgres)**

1. Render Dashboard → **New → Blueprint** → select this repo. `render.yaml` creates:
   - `codegolf-db`: Postgres
   - `codegolf-backend`: public web service (API + WebSockets), single instance
   - `codegolf-executor`: **private** service that runs submissions. No public URL, no DB credentials. Its token is generated and shared with the backend automatically.
2. When prompted, set `CG_CORS_ORIGINS` to your Vercel URL (e.g. `https://code-golf.vercel.app`). Optionally set `CG_CORS_ORIGIN_REGEX` to also allow preview deploys.
3. Note the backend URL, e.g. `https://codegolf-backend.onrender.com`.

Plans: the backend uses `starter` because free web services sleep after 15 minutes idle, which kills live games. Private services aren't available on the free plan.

**2. Vercel (frontend)**

1. **Add New → Project** → import this repo.
2. **Root Directory:** `frontend` (framework auto-detects as Vite).
3. **Environment variable:** `VITE_BACKEND_URL=https://codegolf-backend.onrender.com`
4. Deploy. `frontend/vercel.json` handles SPA routes like `/play/7K4M2`.

If you change the Vercel domain later, update `CG_CORS_ORIGINS` on Render.

> **Sandbox on Render.** Render has no Docker daemon, so the executor runs in `process` mode: a separate private service, non-root, per-test CPU/memory/process/file-size limits, a 2s timeout, and the audit-hook guard. That's reasonable for friends at a game night, but it's weaker than the per-submission containers of `docker` mode (no hard network or filesystem isolation). For public events, run the executor on a VM with Docker (`EXEC_MODE=docker`) and point `CG_EXECUTOR_URL` at it.

### Self-host everything on one VM

`docker compose up -d --build` on any VM with Docker, behind HTTPS (e.g. Caddy: `your-domain.com { reverse_proxy localhost:8080 }`). This uses the full container sandbox. The frontend can still live on Vercel: set `VITE_BACKEND_URL` to the VM and `PUBLIC_ORIGIN` / `CORS_ORIGIN_REGEX` in `.env`.

### Local development (no Docker)

Requires Python 3.12+, [uv](https://docs.astral.sh/uv/) and Node 20+.

```bash
# 1. execution service. "process" mode = rlimited subprocess, NOT a real sandbox. dev only.
cd executor && EXEC_MODE=process uv run uvicorn app.main:app --port 8001

# 2. game server. SQLite is fine for dev; use Postgres anywhere real.
cd backend && CG_DATABASE_URL=sqlite+aiosqlite:///./dev.db uv run uvicorn app.main:app --port 8000 --reload

# 3. frontend (proxies /api and /ws to :8000)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

### Tests

```bash
cd backend  && uv run pytest     # scoring rules, full game flow, timer lock + drain
cd executor && uv run pytest     # verdicts, timeouts, blocked operations
cd frontend && npm run typecheck
```

## How a game night works

1. **Host** opens `/host`, creates a room (optionally with the 5-problem starter pack) and lands on the dashboard.
2. **Players** open `/join`, type the 5-character room code and a name. No accounts.
3. Host clicks **Start round**. Everyone sees `ROUND 03 / PALINDROME CHECKER / 3 · 2 · 1`, then the problem, the original solution and an editor.
4. Players **Run** against sample tests as often as they like, and **Submit** to be judged against the public *and hidden* tests. Only passing submissions count; each player's shortest passing one is their score.
5. At 00:00 the server locks submissions, waits for in-flight judging, ranks everyone and shows the results screen with the shortest solution.
6. Repeat. After the last round, the host clicks **Final results** for the podium.

`/watch/<code>` is a read-only spectator/projector view that works on phones.

### Rules

- **Every character counts**: spaces, tabs and newlines included. CRLF is normalised to LF. Counted in Unicode code points, identical on client and server.
- **Output matching** ignores trailing whitespace on each line and trailing blank lines.
- **Ties share a rank** (standard competition ranking): 27, 27, 29 → 1st, 1st, 3rd. Submission speed is never a tiebreaker.
- **Points** default to `10, 8, 6, 5, 4, 3, 2, 1`; the last value applies to every rank below it. Hosts can change it per room. Players with no passing submission get 0.
- **Movement** arrows on the leaderboard compare against standings before the latest round.

## Architecture

```
frontend/  React + TS + Vite + Tailwind v4 + Monaco
  src/brand/        pixel-art mascot, wordmark, icons, stickers, confetti (all SVG, no images)
  src/components/   Button, Field, Panel, Timer, CharCounter, TerminalLog, CodeEditor
  src/screens/      Lobby, Countdown, Results, Leaderboard, Final: shared by player + spectator
  src/pages/        Landing, Join, Play, Watch, HostCreate, HostDashboard
  src/host/         RoundEditor, ScoringEditor
  src/lib/          api client, useRoom (WebSocket + clock sync), types, session storage
  src/styles/       design tokens (@theme): colours, fonts, radii, motion

backend/   FastAPI + SQLAlchemy 2 (async) + PostgreSQL
  app/models.py         GameRoom, Player, Round, TestCase, Submission, RoundScore
  app/game/scoring.py   pure rules: char counting, competition ranking, points
  app/game/service.py   DB operations: rooms, joins, round CRUD, start/close/finish
  app/game/runtime.py   orchestration: per-room locks, round timers, judging, lock + drain
  app/game/snapshot.py  per-viewer state (host / player / spectator)
  app/realtime/         WebSocket endpoint + in-process fan-out hub
  app/api/rooms.py      REST endpoints

executor/  Isolated execution service (internal network only)
  app/sandbox.py        docker mode (one container per job) / process mode (dev)
  app/judge.py          output comparison → passed | failed | timeout | runtime_error
  sandbox/              image, harness (runner.py), audit-hook guard (guard.py)
```

### Realtime and the clock

The server is the only clock. Starting a round stores `starts_at` (now + 4s countdown) and `ends_at` in the database and arms a server-side timer. Clients never decide when time is up; they render the countdown from those timestamps plus a clock offset estimated from WebSocket ping/pong (lowest-RTT sample wins), so every screen shows the same `02:47`.

State changes (joins, submissions, round transitions) broadcast a fresh snapshot, tailored per viewer:
- **players** never receive hidden tests or other players' code (until results reveal the winning solution),
- **hosts** additionally get every test and every submission.

When time runs out: submissions lock → in-flight judging drains → ranks and points are written → results broadcast. A submission sent a moment before the buzzer (1s grace for network latency) still counts.

On restart, the backend re-arms timers for rounds that were live.

**Scaling note:** timers and fan-out are in-process, so run the backend as **one** worker (the Dockerfile does). One process comfortably handles many rooms of game-night size. To go multi-instance, move `Hub.broadcast_state/emit` onto Redis pub/sub and the round timers onto a single scheduler.

### Code execution & security model

Participant code is untrusted and **never runs in the game server**. The backend sends `{code, tests}` to the executor over an internal network with a shared token. In `docker` mode each job gets a fresh container:

| Control | Setting |
|---|---|
| Network | `--network none` |
| Filesystem | `--read-only` root, `/tmp` as a 16 MB `nosuid,nodev` tmpfs |
| Memory | 128 MB, no swap (`--memory`, `--memory-swap`); `RLIMIT_AS` per test |
| CPU | `--cpus 0.5`; `RLIMIT_CPU` per test |
| Processes | `--pids-limit 32`, `RLIMIT_NOFILE` |
| Privileges | non-root user, `--cap-drop ALL`, `no-new-privileges` |
| Time | 2s wall clock per test, whole-job deadline, container force-removed on overrun |
| Cleanup | `--rm`, no logs kept |

Inside, each test runs in a fresh interpreter behind an audit hook that rejects the obvious crimes (subprocess/exec, sockets, ctypes, file writes, deletes) with `PYTHON CRIMES DETECTED`. That's defence in depth; the container is the boundary. Expected outputs never enter the sandbox: comparison happens outside. Players only get back `passed / failed / timeout / runtime_error`, their own stdout for *public* tests, and the last traceback line with host paths scrubbed.

Things to know before deploying:
- The executor mounts the Docker socket to launch sandbox containers, which is root-equivalent on that host. Keep it on the internal network (compose does), or swap in a rootless daemon, gVisor (`--runtime runsc`), or a dedicated sandbox host.
- `process` mode (local dev, Render) relies on OS limits and the audit hook only. See the Render note above.

### Accounts, tokens and names

No accounts. Creating a room returns a host token and joining returns a player token; both live in `localStorage` so a refresh doesn't kick anyone out. If someone rejoins under a name that's in the room but not currently connected, they get that seat back (new laptop, same player). That's convenient for game night, but anyone who knows the name can do it, so it isn't suitable for anything with stakes.

## Configuration

Backend (`CG_` prefix): `DATABASE_URL` (plain `postgresql://` URLs are accepted), `EXECUTOR_URL`, `EXECUTOR_TOKEN`, `CORS_ORIGINS` (comma-separated), `CORS_ORIGIN_REGEX`, `COUNTDOWN_SECONDS` (4), `SUBMIT_GRACE_SECONDS` (1), `TEST_TIME_LIMIT` (2), `MAX_CODE_CHARS` (10000), `MAX_PLAYERS_PER_ROOM` (64).

Executor (`EXEC_` prefix): `MODE` (`docker`|`process`), `TOKEN`, `SANDBOX_IMAGE`, `MAX_CONCURRENCY` (4), `MEMORY_MB` (128), `CPUS` (0.5), `PIDS_LIMIT` (32), `TMPFS_MB` (16).

Tables are created on startup (`create_all`). Add Alembic before your first schema change in production.

## Brand

| Token | Value | Use |
|---|---|---|
| `ink` | `#071113` | background |
| `green` | `#5CFF72` | accent: actions, GOLF, success. sparingly |
| `deep` | `#063D2C` | green-tinted surfaces |
| `cream` | `#F2EBDD` | text, CODE |
| `slate` | `#26343B` | borders |
| `steel` | `#41545F` | muted |

Fonts: Silkscreen (display), Space Grotesk (UI), JetBrains Mono (code, ligatures **off**, because `==` is two characters). The snake, wordmark and icons are hand-placed pixel grids in `frontend/src/brand/`, rendered as crisp SVG.
