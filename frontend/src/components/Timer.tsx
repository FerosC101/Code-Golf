import { clock } from "../lib/format";

type Props = { remainingMs: number; className?: string };

/** Countdown. Green, then amber at 30s, then red with a gentle pulse for the last 10s. */
export function Timer({ remainingMs, className = "" }: Props) {
  const s = remainingMs / 1000;
  const tone =
    s <= 0
      ? "text-steel"
      : s <= 10
        ? "text-danger animate-urgent [text-shadow:0_0_18px_rgb(224_89_75/0.45)]"
        : s <= 30
          ? "text-amber"
          : "text-green";
  return (
    <span
      className={`inline-block font-display tabular-nums leading-none ${tone} ${className}`}
      role="timer"
      aria-live={s <= 10 ? "polite" : "off"}
    >
      {clock(remainingMs)}
    </span>
  );
}
