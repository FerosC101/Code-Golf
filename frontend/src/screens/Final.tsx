import { Confetti } from "../brand/Confetti";
import { Mascot } from "../brand/Mascot";
import { Sticker } from "../brand/Sticker";
import { Icon } from "../brand/icons";
import type { RoomState } from "../lib/types";
import { Leaderboard } from "./Leaderboard";

// Podium steps are tiers of distinct scores, so a tie for 2nd still leaves a 3rd step.
const STEPS = [
  { tier: 1, height: "h-28 sm:h-36", medal: "🥈", delay: 300 },
  { tier: 0, height: "h-40 sm:h-52", medal: "🥇", delay: 700 },
  { tier: 2, height: "h-20 sm:h-24", medal: "🥉", delay: 0 },
];

/** CODE GOLF CHAMPION podium. */
export function Final({ state, meId }: { state: RoomState; meId?: number }) {
  const board = state.leaderboard;
  const ranks = [...new Set(board.map((e) => e.rank))].sort((a, b) => a - b);
  const byTier = (tier: number) => (tier < ranks.length ? board.filter((e) => e.rank === ranks[tier]) : []);
  const champions = byTier(0);

  return (
    <main className="grid-bg relative flex-1 overflow-hidden px-4 py-8 sm:py-12">
      <Confetti />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="font-mono text-sm text-fog">
          <span className="text-green">&gt;</span> champion detected.<span className="animate-blink text-green">_</span>
        </div>
        <h1 className="mt-3 font-display text-4xl text-cream sm:text-6xl">
          CODE GOLF <span className="text-green">CHAMPION</span>
        </h1>

        <div className="mt-6 flex items-end justify-center gap-3 sm:gap-6">
          {STEPS.map(({ tier, height, medal, delay }) => {
            const winners = byTier(tier);
            const place = tier + 1;
            return (
              <div key={place} className="flex w-28 flex-col items-center sm:w-44" style={{ animationDelay: `${delay}ms` }}>
                {place === 1 && <Mascot className="mb-2 w-32 sm:w-52" />}
                <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
                  <div className="text-3xl sm:text-4xl">{medal}</div>
                  {winners.length ? (
                    winners.map((w) => (
                      <div key={w.player_id} className={`font-display uppercase ${place === 1 ? "text-2xl text-green sm:text-3xl" : "text-lg text-cream sm:text-xl"}`}>
                        {w.name}
                      </div>
                    ))
                  ) : (
                    <div className="font-display text-lg text-steel">—</div>
                  )}
                  <div className="font-mono text-sm text-fog">{winners[0]?.points ?? 0} PTS</div>
                </div>
                <div
                  className={`mt-3 w-full origin-bottom animate-rise border-t-4 ${place === 1 ? "border-green bg-deep" : "border-slate bg-ink-2"} ${height} flex items-start justify-center pt-2 font-display text-4xl text-ink-3`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <span className={place === 1 ? "text-green/40" : "text-steel/60"}>{place}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Bouncing golf ball on the green */}
        <div className="relative mx-auto -mt-1 h-3 max-w-xl bg-[repeating-linear-gradient(90deg,#27933a_0_8px,#3fcf4f_8px_16px)]">
          <Icon name="ball" className="absolute -top-3 left-[18%] h-3 w-3 animate-bounce-ball" />
          <Icon name="flag" className="absolute -top-8 right-[14%] h-8 w-6 text-cream" />
        </div>

        <p className="mt-8 font-display text-xl tracking-widest text-cream">EVERY CHARACTER COUNTED.</p>
        {champions.length > 1 && <p className="mt-1 font-mono text-xs text-fog">&gt; tie at the top. golf is a gentleman&apos;s game.</p>}

        <div className="mx-auto mt-10 max-w-xl text-left">
          <h2 className="label border-b border-slate pb-2">Final leaderboard</h2>
          <Leaderboard entries={board} highlight={meId} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Sticker tilt={-6}>Make it work.</Sticker>
          <Sticker tone="green" tilt={4}>Python crimes detected.</Sticker>
        </div>
      </div>
    </main>
  );
}
