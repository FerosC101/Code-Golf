import { useState } from "react";
import { Button } from "../components/Button";
import type { Difficulty } from "../lib/types";
import { useLibrary } from "../lib/useLibrary";
import { DIFFICULTY_TONE } from "../pages/PracticeList";

type Props = {
  /** Titles already queued in this room, so the host can spot repeats. */
  queued: Set<string>;
  onAdd: (slugs: string[]) => Promise<void>;
  onClose: () => void;
};

export function LibraryPicker({ queued, onAdd, onClose }: Props) {
  const { problems, error } = useLibrary();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  const pickLevel = (d: Difficulty) =>
    setPicked((p) => [...p, ...(problems ?? []).filter((x) => x.difficulty === d && !p.includes(x.slug) && !queued.has(x.title)).map((x) => x.slug)]);

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      await onAdd(picked);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-fog">
        <span>quick pick:</span>
        {(["easy", "medium", "hard", "nightmare"] as Difficulty[]).map((d) => (
          <button key={d} type="button" onClick={() => pickLevel(d)} className={`rounded-sm border px-2 py-0.5 uppercase ${DIFFICULTY_TONE[d]}`}>
            + all {d}
          </button>
        ))}
        {picked.length > 0 && (
          <button type="button" onClick={() => setPicked([])} className="ml-auto hover:text-cream">
            clear
          </button>
        )}
      </div>
      {error && <p className="font-mono text-xs text-danger">&gt; {error.toLowerCase()}</p>}
      {!problems && !error && <p className="font-mono text-xs text-fog">&gt; loading library...</p>}
      <div className="max-h-[420px] overflow-y-auto rounded-sm border border-slate">
        <table className="w-full font-mono text-[13px]">
          <tbody>
            {(problems ?? []).map((p) => {
              const order = picked.indexOf(p.slug);
              return (
                <tr
                  key={p.slug}
                  onClick={() => toggle(p.slug)}
                  className={`cursor-pointer border-b border-line last:border-0 ${order >= 0 ? "bg-deep/50" : "hover:bg-ink-3"}`}
                >
                  <td className="w-10 py-2 pl-3 text-center">
                    {order >= 0 ? <b className="text-green">{order + 1}</b> : <span className="text-steel">○</span>}
                  </td>
                  <td className="py-2">
                    <span className="text-cream">{p.title}</span>
                    {queued.has(p.title) && <span className="ml-2 text-[10px] text-amber">already queued</span>}
                  </td>
                  <td className="py-2">
                    <span className={`rounded-sm border px-1.5 text-[10px] uppercase ${DIFFICULTY_TONE[p.difficulty]}`}>{p.difficulty}</span>
                  </td>
                  <td className="py-2 text-fog">{p.original_chars}</td>
                  <td className="py-2 pr-3 text-right text-fog">
                    par <span className="text-cream">{p.par}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {err && <p className="mt-3 font-mono text-xs text-danger">&gt; {err.toLowerCase()}</p>}
      <div className="mt-4 flex items-center gap-3 border-t border-slate pt-4">
        <Button onClick={add} busy={busy} disabled={!picked.length}>
          Add {picked.length || ""} round{picked.length === 1 ? "" : "s"}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <span className="ml-auto font-mono text-[11px] text-steel">rounds are added in the order you pick them</span>
      </div>
    </div>
  );
}
