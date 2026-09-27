import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "../brand/icons";
import { countChars, quip } from "../lib/format";
import { session } from "../lib/session";
import type { JudgeResult, PublicTest, TestStatus } from "../lib/types";
import { Button } from "./Button";
import { CharCounter } from "./CharCounter";
import { CodeEditor } from "./CodeEditor";
import { Panel } from "./Panel";

export type WorkbenchProblem = {
  fileName: string;
  title: string;
  description: string;
  original_code: string;
  original_chars: number;
  public_tests: PublicTest[];
};

type Feedback =
  | { kind: "run"; result: JudgeResult }
  | { kind: "submit"; result: JudgeResult }
  | { kind: "error"; message: string };

type Props = {
  problem: WorkbenchProblem;
  /** localStorage key for the in-progress draft. */
  draftKey: string;
  locked?: boolean;
  best: number | null;
  judge: (kind: "run" | "submit", source: string) => Promise<JudgeResult>;
  /** Top bar content; receives the live character count. */
  header: (chars: number) => ReactNode;
  seed: number;
};

/** The golf course: problem + original on the left, your editor on the right. */
export function Workbench({ problem, draftKey, locked = false, best, judge: runJudge, header, seed }: Props) {
  const [source, setSource] = useState(() => session.loadDraft(draftKey) ?? problem.original_code);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const chars = useMemo(() => countChars(source), [source]);
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    const id = window.setTimeout(() => session.saveDraft(draftKey, source), 300);
    return () => window.clearTimeout(id);
  }, [draftKey, source]);

  const judge = useCallback(
    async (kind: "run" | "submit") => {
      if (busy || locked) return;
      setBusy(kind);
      try {
        setFeedback({ kind, result: await runJudge(kind, sourceRef.current) });
      } catch (err) {
        setFeedback({ kind: "error", message: (err as Error).message });
      } finally {
        setBusy(null);
      }
    },
    [busy, locked, runJudge],
  );

  return (
    <div className="flex h-dvh min-h-[640px] flex-col">
      {header(chars)}

      <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
        {/* LEFT: problem + original */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel title={problem.fileName} bodyClassName="overflow-y-auto p-5">
            <h1 className="font-display text-2xl leading-tight text-cream uppercase">{problem.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/85">
              <Prose text={problem.description} />
            </p>
            {problem.public_tests.length > 0 && (
              <div className="mt-5">
                <h3 className="label mb-2">Sample tests</h3>
                <div className="grid gap-2">
                  {problem.public_tests.map((t, i) => (
                    <div key={i} className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-slate bg-slate font-mono text-xs">
                      <IO label={`stdin #${i + 1}`} value={t.input} />
                      <IO label="stdout" value={t.expected_output} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[11px] text-steel">+ hidden tests on submit</p>
              </div>
            )}
          </Panel>
          <Panel
            title="Original solution"
            actions={<span className="font-mono text-[11px] text-fog">{problem.original_chars} chars · read-only</span>}
            className="min-h-[200px] flex-1"
            bodyClassName="h-full"
          >
            <CodeEditor value={problem.original_code} readOnly fontSize={13} className="h-full" />
          </Panel>
        </div>

        {/* RIGHT: your code */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel
            title={<span className="!text-green">Your code</span>}
            chrome
            className={`min-h-[260px] flex-1 ${locked ? "opacity-70" : "border-green/40"}`}
            bodyClassName="h-full"
            actions={
              <button
                type="button"
                onClick={() => setSource(problem.original_code)}
                disabled={locked}
                className="font-mono text-[11px] text-fog hover:text-cream disabled:opacity-40"
              >
                reset
              </button>
            }
          >
            <CodeEditor
              value={source}
              onChange={setSource}
              readOnly={locked}
              className="h-full"
              fontSize={16}
              onRunShortcut={() => judge("run")}
              onSubmitShortcut={() => judge("submit")}
            />
          </Panel>

          <div className="rounded-md border border-slate bg-ink-2 p-4">
            <CharCounter count={chars} best={best} original={problem.original_chars} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="lg" onClick={() => judge("run")} busy={busy === "run"} disabled={locked || !!busy}>
                ▶ Run
              </Button>
              <Button size="lg" onClick={() => judge("submit")} busy={busy === "submit"} disabled={locked || !!busy}>
                Submit
              </Button>
              <span className="ml-auto hidden font-mono text-[11px] text-steel xl:inline">⌘↵ run · ⌘⇧↵ submit</span>
            </div>
            <FeedbackView feedback={feedback} locked={locked} busy={busy} seed={seed + chars} />
          </div>
        </div>
      </main>
    </div>
  );
}

function IO({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink px-3 py-2">
      <div className="mb-1 text-[10px] tracking-widest text-steel uppercase">{label}</div>
      <pre className="whitespace-pre-wrap break-all text-cream">{value || <span className="text-steel">(empty)</span>}</pre>
    </div>
  );
}

/** Minimal `code` support in problem descriptions. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded-sm bg-ink px-1 py-0.5 font-mono text-[0.9em] text-green">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const STATUS_LABEL: Record<TestStatus, string> = {
  passed: "passed",
  failed: "wrong output",
  timeout: "timeout",
  runtime_error: "runtime error",
};

function FeedbackView({ feedback, locked, busy, seed }: { feedback: Feedback | null; locked: boolean; busy: string | null; seed: number }) {
  const [reveal, setReveal] = useState(false);
  if (busy) {
    return (
      <Line tone="fog">
        {busy === "run" ? "running sample tests" : "judging against hidden tests"}
        <span className="animate-blink">...</span>
      </Line>
    );
  }
  if (locked && !feedback) return <Line tone="amber">submissions locked.</Line>;
  if (!feedback) return <Line tone="fog">make it shorter. make it work.</Line>;
  if (feedback.kind === "error") return <Line tone="danger">{feedback.message.toLowerCase()}</Line>;

  const r = feedback.result;
  const tests = (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px]">
      {r.public.map((t, i) => (
        <li key={t.index} className={t.status === "passed" ? "text-green" : "text-danger"} title={t.error || undefined}>
          {t.status === "passed" ? "✓" : "✗"} Test {i + 1}
          {t.status !== "passed" && <span className="ml-1 text-fog">· {STATUS_LABEL[t.status]}</span>}
        </li>
      ))}
      {r.hidden_total > 0 && (
        <li className={r.hidden_passed === r.hidden_total ? "text-green" : "text-danger"}>
          {r.hidden_passed === r.hidden_total ? "✓" : "✗"} Hidden {r.hidden_passed}/{r.hidden_total}
        </li>
      )}
    </ul>
  );
  const firstFail = r.public.find((t) => t.status !== "passed");
  const detail = firstFail && (firstFail.error || firstFail.stdout) && (
    <pre className="mt-2 max-h-24 overflow-auto rounded-sm bg-ink px-3 py-2 font-mono text-xs whitespace-pre-wrap text-fog">
      {firstFail.error ? <span className="text-danger">{firstFail.error}</span> : <>your output: {firstFail.stdout}</>}
    </pre>
  );

  if (feedback.kind === "run") {
    return (
      <div>
        <Line tone={r.passed ? "green" : "danger"}>
          {r.passed ? "sample tests passed" : `${r.failed} test${r.failed === 1 ? "" : "s"} failed`}
        </Line>
        {tests}
        {detail}
      </div>
    );
  }

  if (!r.passed) {
    return (
      <div>
        <Line tone="danger">
          {r.failed} test{r.failed === 1 ? "" : "s"} failed. submission not counted.
        </Line>
        {tests}
        {detail}
      </div>
    );
  }

  const prev = r.previous_best;
  const improved = prev != null && r.chars < prev;
  return (
    <div className="mt-4 animate-rise border-l-2 border-green bg-deep/40 px-4 py-3">
      {improved ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="font-display text-lg text-green">NEW PERSONAL BEST</span>
          <span className="font-mono text-sm text-cream">
            {prev} → <b className="text-green">{r.chars}</b>
          </span>
          <span className="font-mono text-xs font-bold tracking-widest text-cream">{prev! - r.chars} CHARACTERS SAVED.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="font-display text-lg text-green">VALID SUBMISSION</span>
          <span className="font-mono text-sm text-cream">
            <b>{r.chars}</b> CHARACTERS
          </span>
          <span className="font-mono text-xs text-fog">ALL TESTS PASSED</span>
          {prev != null && r.chars >= prev && <span className="font-mono text-xs text-fog">· best still {prev}</span>}
        </div>
      )}
      {r.par != null && <ParLine chars={r.chars} par={r.par} />}
      <div className="mt-1 flex items-center gap-2 font-mono text-xs text-fog">
        <Icon name="check" className="h-3 w-3 text-green" /> {quip(seed)}
      </div>
      {r.par_solution && (
        <div className="mt-3">
          <button type="button" onClick={() => setReveal(!reveal)} className="font-mono text-[11px] text-fog hover:text-green">
            {reveal ? "▾ hide" : "▸ reveal"} the par solution ({r.par} chars)
          </button>
          {reveal && (
            <pre className="mt-2 overflow-x-auto rounded-sm bg-ink px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all text-cream">
              {r.par_solution}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/** Golf scoring against par: fewer characters is under par. */
export function parLabel(chars: number, par: number): { text: string; tone: string } {
  const diff = chars - par;
  if (diff < 0) return { text: `${diff} UNDER PAR`, tone: "text-green" };
  if (diff === 0) return { text: "PAR", tone: "text-cream" };
  return { text: `+${diff} OVER PAR`, tone: "text-amber" };
}

function ParLine({ chars, par }: { chars: number; par: number }) {
  const { text, tone } = parLabel(chars, par);
  return (
    <div className="mt-1 font-mono text-xs text-fog">
      par <b className="text-cream">{par}</b> · <b className={tone}>{text}</b>
      {chars < par && <span className="ml-2 text-green">birdie energy.</span>}
    </div>
  );
}

function Line({ tone, children }: { tone: "green" | "danger" | "fog" | "amber"; children: React.ReactNode }) {
  const color = { green: "text-green", danger: "text-danger", fog: "text-fog", amber: "text-amber" }[tone];
  return (
    <p className={`mt-4 font-mono text-sm ${color}`}>
      <span className="text-green">&gt;</span> {children}
    </p>
  );
}

