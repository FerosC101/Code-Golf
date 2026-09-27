import { Sticker } from "../brand/Sticker";
import { Icon } from "../brand/icons";
import { MEDALS, pad2 } from "../lib/format";
import type { RoomState } from "../lib/types";
import { Leaderboard } from "./Leaderboard";

/** ROUND 02 RESULTS + shortest solution + running leaderboard. */
export function Results({ state, meId, footer }: { state: RoomState; meId?: number; footer?: React.ReactNode }) {
  const r = state.results;
  if (!r) return null;
  const valid = r.entries.filter((e) => e.status === "valid");
  const rest = r.entries.filter((e) => e.status !== "valid");
  const isLast = state.room.rounds_left === 0;

  return (
    <main className="grid-bg flex-1 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-rise">
          <div>
            <div className="font-mono text-xs text-fog">
              <span className="text-green">&gt;</span> submissions locked.
            </div>
            <h1 className="mt-2 font-display text-4xl text-cream sm:text-6xl">
              ROUND {pad2(r.round_number)} <span className="text-green">RESULTS</span>
            </h1>
            <p className="mt-1 font-mono text-sm text-fog uppercase">{r.title}</p>
          </div>
          <Sticker tone="cream" tilt={-5} className="hidden sm:inline-block">
            Shorter is
            <br />
            better
          </Sticker>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
          <section>
            <h2 className="label border-b border-slate pb-2">Round ranking</h2>
            {valid.length === 0 && (
              <p className="py-6 font-mono text-sm text-fog">
                <span className="text-danger">&gt;</span> nobody made it work. the original survives.
              </p>
            )}
            <ol className="divide-y divide-line">
              {valid.map((e, i) => (
                <li
                  key={e.player_id}
                  className={`grid grid-cols-[3rem_1fr_auto_4rem] items-center gap-3 py-3 animate-rise ${e.player_id === meId ? "bg-deep/40" : ""}`}
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                >
                  <span className="text-center font-display text-2xl">
                    {MEDALS[e.rank!] ?? <span className="text-steel">{e.rank}</span>}
                  </span>
                  <span className="truncate font-display text-lg text-cream sm:text-xl">{e.name}</span>
                  <span className="font-mono text-sm text-fog tabular-nums">
                    <b className="text-cream">{e.chars}</b> CHARS
                  </span>
                  <span className="text-right font-display text-xl text-green">+{e.points}</span>
                </li>
              ))}
              {rest.map((e) => (
                <li key={e.player_id} className="grid grid-cols-[3rem_1fr_auto_4rem] items-center gap-3 py-2 font-mono text-sm text-fog">
                  <span className="text-center">–</span>
                  <span className="truncate">{e.name}</span>
                  <span className={e.status === "failed" ? "text-danger" : ""}>
                    {e.status === "failed" ? "FAILED" : "NO SUBMISSION"}
                  </span>
                  <span className="text-right">+0</span>
                </li>
              ))}
            </ol>

            {r.shortest && (
              <div className="mt-8 animate-rise rounded-md border border-green/50 bg-ink-2 [animation-delay:500ms]">
                <div className="flex items-center justify-between border-b border-slate px-4 py-2">
                  <span className="label !text-green">Shortest solution</span>
                  <span className="font-mono text-xs text-fog">by {r.shortest.name}</span>
                </div>
                <pre className="overflow-x-auto px-4 py-4 font-mono text-[15px] leading-relaxed whitespace-pre-wrap break-all text-cream">
                  {r.shortest.code}
                </pre>
                <div className="flex items-center gap-4 border-t border-slate px-4 py-2 font-mono text-xs text-fog">
                  <span>
                    <b className="font-display text-lg text-green">{r.shortest.chars}</b> CHARACTERS
                  </span>
                  <span>
                    original <b className="text-cream">{r.original_chars}</b> →{" "}
                    <b className="text-green">-{r.original_chars - r.shortest.chars}</b>
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="animate-rise [animation-delay:250ms]">
            <h2 className="label flex items-center gap-2 border-b border-slate pb-2">
              <Icon name="trophy" className="h-3.5 w-3.5 text-green" /> Game leaderboard
            </h2>
            <Leaderboard entries={state.leaderboard} highlight={meId} />
            <div className="mt-6 font-mono text-xs text-fog">
              {isLast ? (
                <>
                  <span className="text-green">&gt;</span> final round complete. waiting for the podium...
                </>
              ) : (
                <>
                  <span className="text-green">&gt;</span> {state.room.rounds_left} round{state.room.rounds_left === 1 ? "" : "s"} left.
                  waiting for host<span className="animate-blink">_</span>
                </>
              )}
            </div>
            {footer}
          </section>
        </div>
      </div>
    </main>
  );
}
