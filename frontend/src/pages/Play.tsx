import { useCallback, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { CharCounter } from "../components/CharCounter";
import { Timer } from "../components/Timer";
import { Workbench } from "../components/Workbench";
import { api } from "../lib/api";
import { pad2 } from "../lib/format";
import { session } from "../lib/session";
import type { RoomState, RoundInfo } from "../lib/types";
import { useRoom, useServerNow } from "../lib/useRoom";
import { Countdown } from "../screens/Countdown";
import { Final } from "../screens/Final";
import { Lobby } from "../screens/Lobby";
import { Results } from "../screens/Results";
import { RoomBadge, TopBar } from "../screens/TopBar";

export default function Play() {
  const { code = "" } = useParams();
  const me = session.player(code);
  const { state, connection, fatal, serverNow } = useRoom(code, { token: me?.token });
  const now = useServerNow(serverNow);

  if (!me) return <Navigate to={`/join?code=${code.toUpperCase()}`} replace />;
  if (fatal) return <Gone message={fatal} code={code} forget />;
  if (!state) return <Booting />;

  const status = state.room.status;
  const round = state.round;
  const live = status === "active" && round && round.starts_at != null;

  if (live && now < round.starts_at!) {
    return (
      <Shell state={state} connection={connection}>
        <Countdown round={round} remainingMs={round.starts_at! - now} />
      </Shell>
    );
  }
  if (live) {
    return <Workspace key={round.id} state={state} round={round} now={now} token={me.token} connection={connection} />;
  }
  return (
    <Shell state={state} connection={connection}>
      {status === "results" && <Results state={state} meId={me.id} />}
      {status === "finished" && <Final state={state} meId={me.id} />}
      {status === "lobby" && <Lobby state={state} meId={me.id} />}
    </Shell>
  );
}

function Shell({ state, connection, children }: { state: RoomState; connection: ReturnType<typeof useRoom>["connection"]; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar connection={connection}>
        <RoomBadge code={state.room.code} />
        {state.me && (
          <span className="hidden font-mono text-xs text-fog sm:inline">
            {state.me.name} · <b className="text-green">{state.me.points}</b> pts
          </span>
        )}
      </TopBar>
      {children}
    </div>
  );
}

// ── the competition screen ──────────────────────────────────────────────────

function Workspace({
  state,
  round,
  now,
  token,
  connection,
}: {
  state: RoomState;
  round: RoundInfo;
  now: number;
  token: string;
  connection: ReturnType<typeof useRoom>["connection"];
}) {
  const code = state.room.code;
  const remaining = (round.ends_at ?? 0) - now;
  const judge = useCallback(
    (kind: "run" | "submit", source: string) => (kind === "run" ? api.run : api.submit)(code, token, source),
    [code, token],
  );

  return (
    <Workbench
      problem={{ ...round, fileName: `round_${pad2(round.number)}.py` }}
      draftKey={`cg:draft:${code}:${round.number}`}
      locked={remaining <= 0}
      best={state.me?.best_chars ?? null}
      judge={judge}
      seed={round.id}
      header={(chars) => (
        <TopBar connection={connection}>
          <span className="hidden font-mono text-xs tracking-[0.2em] text-fog md:inline">
            ROUND <b className="text-cream">{round.number}</b> / {state.room.total_rounds}
          </span>
          <Timer remainingMs={remaining} className="text-3xl sm:text-4xl" />
          <span className="hidden sm:inline">
            <CharCounter count={chars} size="sm" />
          </span>
        </TopBar>
      )}
    />
  );
}

function Booting() {
  return (
    <div className="grid-bg flex min-h-dvh items-center justify-center font-mono text-sm text-fog">
      <span className="text-green">&gt;</span>&nbsp;connecting<span className="animate-blink">_</span>
    </div>
  );
}

function Gone({ message, code, forget }: { message: string; code: string; forget?: boolean }) {
  useEffect(() => {
    if (forget) session.setPlayer(code, null);
  }, [forget, code]);
  return (
    <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Mascot variant="head" className="w-24 opacity-80" />
      <p className="font-mono text-sm text-fog">
        <span className="text-danger">&gt;</span> {message.toLowerCase()}
      </p>
      <Link to={`/join?code=${code.toUpperCase()}`} className="font-mono text-sm text-green underline-offset-4 hover:underline">
        rejoin →
      </Link>
    </div>
  );
}

export { Booting, Gone };
