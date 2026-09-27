import { useState } from "react";
import { Button } from "../components/Button";
import { ordinal } from "../lib/format";

const DEFAULT = [10, 8, 6, 5, 4, 3, 2, 1];

export function ScoringEditor({ scoring, onSave }: { scoring: number[]; onSave: (s: number[]) => Promise<void> }) {
  const [text, setText] = useState(scoring.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  const valid = parsed.length > 0 && parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 1000);
  const dirty = parsed.join(",") !== scoring.join(",");

  async function save(values: number[]) {
    setBusy(true);
    setError(null);
    try {
      await onSave(values);
      setText(values.join(", "));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-9 w-full rounded-sm border border-slate bg-ink px-2 font-mono text-sm text-cream outline-none focus:border-green"
        aria-label="Points per rank, comma separated"
      />
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-fog">
        {valid &&
          parsed.map((p, i) => (
            <span key={i}>
              {ordinal(i + 1)}
              {i === parsed.length - 1 ? "+" : ""} <b className="text-cream">{p}</b>
            </span>
          ))}
      </div>
      {error && <p className="font-mono text-xs text-danger">&gt; {error.toLowerCase()}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={!valid || !dirty} busy={busy} onClick={() => save(parsed)}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => save(DEFAULT)} disabled={busy}>
          Default
        </Button>
      </div>
      <p className="font-mono text-[10px] leading-4 text-steel">same length? first to submit it ranks higher. last value applies to every rank below. changes apply to rounds not yet scored.</p>
    </div>
  );
}
