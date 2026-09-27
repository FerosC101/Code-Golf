import { pad2 } from "../lib/format";
import type { RoundInfo } from "../lib/types";

/** ROUND 03 / PALINDROME CHECKER / 3·2·1 — full-screen arcade intro. */
export function Countdown({ round, remainingMs }: { round: RoundInfo; remainingMs: number }) {
  const n = Math.ceil(remainingMs / 1000);
  const label = n > 3 ? null : n >= 1 ? String(n) : "GO";
  return (
    <main className="grid-bg relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="animate-rise font-mono text-sm tracking-[0.4em] text-fog">
        <span className="text-green">&gt;</span> loading round_{pad2(round.number)}.py
      </div>
      <h1 className="mt-6 animate-rise font-display text-6xl text-cream sm:text-8xl">ROUND {pad2(round.number)}</h1>
      <h2 className="mt-3 animate-rise font-display text-2xl text-green uppercase [animation-delay:150ms] sm:text-3xl">
        {round.title}
      </h2>
      <div className="mt-12 font-mono text-xs tracking-[0.4em] text-fog">STARTING IN</div>
      <div className="relative mt-2 flex h-40 items-center justify-center sm:h-52">
        {label && (
          <span key={label} className="animate-count-in font-display text-[9rem] leading-none text-green sm:text-[12rem]">
            {label}
          </span>
        )}
      </div>
      <p className="mt-6 font-display text-lg tracking-widest text-cream">MAKE IT SHORTER.</p>
    </main>
  );
}
