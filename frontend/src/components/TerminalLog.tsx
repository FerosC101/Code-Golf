import { useEffect, useState } from "react";

type Props = { lines: string[]; className?: string; loop?: boolean; tone?: "green" | "fog" };

/** `> initializing round...` lines typed out one after another. */
export function TerminalLog({ lines, className = "", loop = false, tone = "fog" }: Props) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    setShown(1);
    const id = window.setInterval(() => {
      setShown((n) => (n >= lines.length ? (loop ? 1 : n) : n + 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [lines, loop]);

  return (
    <div className={`font-mono text-sm leading-7 ${className}`} aria-live="polite">
      {lines.slice(0, shown).map((line, i) => (
        <div key={`${i}-${line}`} className={`animate-rise ${i === shown - 1 && tone === "fog" ? "text-green" : "text-fog"}`}>
          <span className="text-green">&gt;</span> {line}
          {i === shown - 1 && <span className="ml-1 animate-blink text-green">▮</span>}
        </div>
      ))}
    </div>
  );
}
