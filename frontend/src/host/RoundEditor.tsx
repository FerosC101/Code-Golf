import { useState } from "react";
import { Button } from "../components/Button";
import { CodeEditor } from "../components/CodeEditor";
import { Input, TextArea } from "../components/Field";
import type { RoundPayload } from "../lib/api";
import { countChars } from "../lib/format";
import type { HostRound } from "../lib/types";

const EMPTY: RoundPayload = {
  title: "",
  description: "",
  original_code: "",
  duration_seconds: 300,
  tests: [
    { input: "", expected_output: "", hidden: false },
    { input: "", expected_output: "", hidden: true },
  ],
};

type Props = {
  round?: HostRound;
  onSave: (data: RoundPayload) => Promise<void>;
  onCancel: () => void;
};

export function RoundEditor({ round, onSave, onCancel }: Props) {
  const [data, setData] = useState<RoundPayload>(() =>
    round
      ? {
          title: round.title,
          description: round.description,
          original_code: round.original_code,
          duration_seconds: round.duration_seconds,
          tests: round.tests.map((t) => ({ ...t })),
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof RoundPayload>(key: K, value: RoundPayload[K]) => setData((d) => ({ ...d, [key]: value }));
  const setTest = (i: number, patch: Partial<RoundPayload["tests"][number]>) =>
    set("tests", data.tests.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function save() {
    if (!data.title.trim()) return setError("give it a title");
    setBusy(true);
    setError(null);
    try {
      await onSave(data);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const publicCount = data.tests.filter((t) => !t.hidden).length;

  return (
    <div className="space-y-5 p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Input label="Problem title" value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Palindrome Checker" maxLength={120} />
        <Input
          label="Timer (sec)"
          type="number"
          min={30}
          max={3600}
          step={30}
          value={data.duration_seconds}
          onChange={(e) => set("duration_seconds", Number(e.target.value))}
        />
      </div>
      <TextArea
        label="Description · `backticks` render as code"
        rows={3}
        value={data.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Read one line from stdin. Print True if it's a palindrome."
      />
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="label">Original working solution</span>
          <span className="font-mono text-[11px] text-fog">{countChars(data.original_code)} chars</span>
        </div>
        <div className="h-56 overflow-hidden rounded-sm border border-slate">
          <CodeEditor value={data.original_code} onChange={(v) => set("original_code", v)} fontSize={13} className="h-full" />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="label">
            Test cases · {publicCount} public · {data.tests.length - publicCount} hidden
          </span>
          <span className="font-mono text-[11px] text-steel">stdin → expected stdout (trailing whitespace ignored)</span>
        </div>
        <div className="space-y-2">
          {data.tests.map((t, i) => (
            <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_auto] items-start gap-2">
              <span className="pt-2 font-mono text-xs text-steel">{String(i + 1).padStart(2, "0")}</span>
              <TextArea rows={2} value={t.input} placeholder="stdin" onChange={(e) => setTest(i, { input: e.target.value })} className="font-mono" />
              <TextArea
                rows={2}
                value={t.expected_output}
                placeholder="expected stdout"
                onChange={(e) => setTest(i, { expected_output: e.target.value })}
              />
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => setTest(i, { hidden: !t.hidden })}
                  className={`w-18 rounded-sm border px-2 py-1 font-mono text-[10px] tracking-widest ${t.hidden ? "border-slate text-fog" : "border-green/60 text-green"}`}
                  title="Hidden tests are only run on submit and never shown to players"
                >
                  {t.hidden ? "HIDDEN" : "PUBLIC"}
                </button>
                <button
                  type="button"
                  onClick={() => set("tests", data.tests.filter((_, j) => j !== i))}
                  className="font-mono text-[10px] text-steel hover:text-danger"
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => set("tests", [...data.tests, { input: "", expected_output: "", hidden: true }])}
        >
          + add test
        </Button>
      </div>

      {error && <p className="font-mono text-xs text-danger">&gt; {error.toLowerCase()}</p>}
      <div className="flex gap-3 border-t border-slate pt-4">
        <Button onClick={save} busy={busy}>
          {round ? "Save round" : "Add round"}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
