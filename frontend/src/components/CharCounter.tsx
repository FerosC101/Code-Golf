import { useEffect, useRef, useState } from "react";

type Props = { count: number; best?: number | null; original?: number; size?: "lg" | "sm" };

/** "31 CHARACTERS" with a brief pop + "-2 chars" whenever the count drops. */
export function CharCounter({ count, best, original, size = "lg" }: Props) {
  const prev = useRef(count);
  const [delta, setDelta] = useState<{ from: number; by: number; key: number } | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = count;
    if (count < before) setDelta({ from: before, by: count - before, key: Date.now() });
  }, [count]);

  if (size === "sm") {
    return (
      <span className="font-mono text-sm">
        <span className="text-fog">{"{"}</span>
        <span className="font-bold text-cream tabular-nums">{count}</span>
        <span className="text-fog">{"}"}</span> <span className="text-fog">CHARS</span>
      </span>
    );
  }

  return (
    <div className="flex items-end gap-4">
      <div className="flex items-baseline gap-3">
        <span key={delta?.key} className="inline-block animate-pop font-display text-5xl leading-none text-cream tabular-nums">
          {count}
        </span>
        <span className="font-mono text-xs font-bold tracking-[0.25em] text-fog">CHARACTERS</span>
      </div>
      {delta && (
        <span key={`d${delta.key}`} className="mb-1 animate-fade-up font-mono text-xs text-green">
          {delta.from} → {count} <b>{delta.by} chars</b>
        </span>
      )}
      <div className="ml-auto flex gap-5 pb-0.5 font-mono text-[11px] text-fog">
        {original != null && (
          <span>
            ORIGINAL <b className="text-cream">{original}</b>
          </span>
        )}
        {best != null && (
          <span>
            BEST <b className="text-green">{best}</b>
          </span>
        )}
      </div>
    </div>
  );
}
