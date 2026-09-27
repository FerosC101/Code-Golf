import { useMemo } from "react";

const COLORS = ["var(--color-green)", "var(--color-cream)", "var(--color-green-2)", "#79f58a", "var(--color-python-yellow)"];

/** Square pixel confetti. Pure CSS, no canvas, capped at `count` pieces. */
export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.4,
        duration: 2.6 + Math.random() * 2.2,
        size: [4, 6, 8][i % 3],
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 80,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      <style>{`@keyframes cg-fall{0%{transform:translate(0,-20px)}100%{transform:translate(var(--dx),105vh)}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              "--dx": `${p.drift}px`,
              animation: `cg-fall ${p.duration}s steps(24) ${p.delay}s 2 both`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
