import { useParams } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { Icon } from "../brand/icons";
import { Timer } from "../components/Timer";
import { pad2 } from "../lib/format";
import type { RoomEvent, RoomState, RoundInfo } from "../lib/types";
import { useRoom, useServerNow } from "../lib/useRoom";
import { Countdown } from "../screens/Countdown";
import { Final } from "../screens/Final";
import { Lobby } from "../screens/Lobby";
import { Results } from "../screens/Results";
import { RoomBadge, TopBar } from "../screens/TopBar";
import { Booting, Gone } from "./Play";

/** Spectator / projector view. Works on phones; no code editing here. */
export default function Watch() {
  const { code = "" } = useParams();
  const { state, events, connection, fatal, serverNow } = useRoom(code);
  const now = useServerNow(serverNow);

  if (fatal) return <Gone message={fatal} code={code} />;
  if (!state) return <Booting />;

  const round = state.round;
  const live = state.room.status === "active" && round?.starts_at != null;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar connection={connection}>
        <RoomBadge code={state.room.code} />
        <span className="hidden font-mono text-[11px] tracking-[0.3em] text-fog sm:inline">SPECTATING</span>
      </TopBar>
      {state.room.status === "lobby" && <Lobby state={state} />}
      {live && now < round!.starts_at! && <Countdown round={round!} remainingMs={round!.starts_at! - now} />}
      {live && now >= round!.starts_at! && <LiveBoard state={state} round={round!} now={now} events={events} />}
      {state.room.status === "results" && <Results state={state} />}
      {state.room.status === "finished" && <Final state={state} />}
    </div>
  );
}

function LiveBoard({ state, round, now, events }: { state: RoomState; round: RoundInfo; now: number; events: RoomEvent[] }) {
  const remaining = (round.ends_at ?? 0) - now;
  const valid = state.players.filter((p) => p.valid).length;
  const feed = events.filter((e) => e.kind === "submission" || e.kind === "locked").slice(-8).reverse();

  return (
    <main className="grid-bg flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="font-mono text-xs tracking-[0.3em] text-fog">
            ROUND {pad2(round.number)} / {pad2(state.room.total_rounds)}
          </div>
          <h1 className="mt-2 font-display text-3xl text-cream uppercase sm:text-5xl">{round.title}</h1>
          <Timer remainingMs={remaining} className="mt-6 text-7xl sm:text-9xl" />
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">{round.description.replace(/`/g, "")}</p>
          <div className="mt-8 flex gap-10 font-mono">
            <div>
              <div className="label">Original</div>
              <div className="font-display text-3xl text-cream">{round.original_chars}</div>
            </div>
            <div>
              <div className="label">Valid solutions</div>
              <div className="font-display text-3xl text-green">
                {valid}
                <span className="text-lg text-fog">/{state.players.length}</span>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h2 className="label flex items-center gap-2 border-b border-slate pb-2">
            <Icon name="users" className="h-3.5 w-3.5" /> Players
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 font-mono text-sm">
            {state.players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 border-b border-line py-2">
                <span className={p.valid ? "text-green" : p.attempts ? "text-amber" : "text-steel"}>
                  {p.valid ? "✓" : p.attempts ? "…" : "○"}
                </span>
                <span className={`truncate ${p.connected ? "text-cream" : "text-steel"}`}>{p.name}</span>
              </li>
            ))}
          </ul>
          <h2 className="label mt-8 border-b border-slate pb-2">Feed</h2>
          <div className="mt-2 space-y-1 font-mono text-xs text-fog">
            {feed.length === 0 && <p>&gt; heads down. keys clacking.</p>}
            {feed.map((e) => (
              <p key={e.at + e.text} className="animate-rise">
                <span className={e.passed ? "text-green" : "text-danger"}>&gt;</span> {e.text}
              </p>
            ))}
          </div>
          <Mascot variant="head" idle className="mt-10 ml-auto w-16 opacity-80" />
        </section>
      </div>
    </main>
  );
}
