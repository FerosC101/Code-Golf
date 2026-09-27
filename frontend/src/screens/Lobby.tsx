import { Mascot } from "../brand/Mascot";
import { Wordmark } from "../brand/Wordmark";
import { TerminalLog } from "../components/TerminalLog";
import { pad2 } from "../lib/format";
import type { RoomState } from "../lib/types";

const BOOT = ["initializing round...", "loading Python crimes...", "stripping whitespace...", "waiting for host..."];

export function Lobby({ state, meId }: { state: RoomState; meId?: number }) {
  const online = state.players.filter((p) => p.connected).length;
  return (
    <main className="grid-bg flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-12">
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <div className="animate-rise">
          <Wordmark className="w-40 sm:w-48" />
          <div className="mt-8 font-mono text-sm text-fog">ROOM</div>
          <div className="font-display text-5xl tracking-[0.12em] text-cream sm:text-6xl">{state.room.code}</div>
          <div className="mt-1 font-mono text-xs text-fog">{state.room.name}</div>
          <p className="mt-8 font-display text-xl text-green">Waiting for the host...</p>
          <TerminalLog lines={BOOT} className="mt-4" />
          <a href="/practice" target="_blank" rel="noreferrer" className="mt-6 inline-block font-mono text-xs text-fog hover:text-green">
            <span className="text-green">&gt;</span> warm up on the practice range ↗
          </a>
          <Mascot variant="head" idle className="mt-8 hidden w-24 md:block" />
        </div>

        <section className="animate-rise [animation-delay:120ms]">
          <div className="flex items-baseline justify-between border-b border-slate pb-2">
            <h2 className="label">Players connected</h2>
            <span className="font-display text-2xl text-green tabular-nums">{online}</span>
          </div>
          {state.players.length === 0 ? (
            <p className="py-8 font-mono text-sm text-fog">
              <span className="text-green">&gt;</span> no players yet. share the room code.
            </p>
          ) : (
            <ol className="divide-y divide-line">
              {state.players.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 py-2.5 font-mono text-sm animate-rise">
                  <span className="w-6 text-steel tabular-nums">{pad2(i + 1)}</span>
                  <span className={p.id === meId ? "text-green" : "text-cream"}>
                    {p.name}
                    {p.id === meId && <span className="ml-2 text-[11px] text-fog">(you)</span>}
                  </span>
                  <span
                    className={`ml-auto h-2 w-2 ${p.connected ? "bg-green" : "bg-steel"}`}
                    title={p.connected ? "online" : "offline"}
                  />
                </li>
              ))}
            </ol>
          )}
          <p className="mt-6 font-mono text-[11px] text-fog">
            {state.room.total_rounds > 0 ? `${state.room.total_rounds} rounds queued · ` : ""}Python only · every character counts
          </p>
        </section>
      </div>
    </main>
  );
}
