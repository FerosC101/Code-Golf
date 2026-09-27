import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { Icon } from "../brand/icons";
import { Button } from "../components/Button";
import { CharCounter } from "../components/CharCounter";
import { CodeEditor } from "../components/CodeEditor";
import { Panel } from "../components/Panel";
import { Timer } from "../components/Timer";
import { api } from "../lib/api";
import { countChars, pad2, quip } from "../lib/format";
import { session } from "../lib/session";
import type { JudgeResult, RoomState, RoundInfo, TestStatus } from "../lib/types";
import { useRoom, useServerNow } from "../lib/useRoom";
import { Countdown } from "../screens/Countdown";
import { Final } from "../screens/Final";
import { Lobby } from "../screens/Lobby";
import { Results } from "../screens/Results";
import { RoomBadge, TopBar } from "../screens/TopBar";

export default function Play() {
  const { code = "" } = useParams();
  const me = session.player(code);
  const { state, connection, fatal, serverNow } = useRoom(code, { token: me?.token });
  const now = useServerNow(serverNow);

  if (!me) return <Navigate to={`/join?code=${code.toUpperCase()}`} replace />;
  if (fatal) return <Gone message={fatal} code={code} forget />;
  if (!state) return <Booting />;

  const status = state.room.status;
  const round = state.round;
  const live = status === "active" && round && round.starts_at != null;

  if (live && now < round.starts_at!) {
    return (
      <Shell state={state} connection={connection}>
        <Countdown round={round} remainingMs={round.starts_at! - now} />
      </Shell>
    );
  }
  if (live) {
    return <Workspace key={round.id} state={state} round={round} now={now} token={me.token} connection={connection} />;
  }
  return (
    <Shell state={state} connection={connection}>
      {status === "results" && <Results state={state} meId={me.id} />}
      {status === "finished" && <Final state={state} meId={me.id} />}
      {status === "lobby" && <Lobby state={state} meId={me.id} />}
    </Shell>
  );
}

function Shell({ state, connection, children }: { state: RoomState; connection: ReturnType<typeof useRoom>["connection"]; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar connection={connection}>
        <RoomBadge code={state.room.code} />
        {state.me && (
          <span className="hidden font-mono text-xs text-fog sm:inline">
            {state.me.name} · <b className="text-green">{state.me.points}</b> pts
          </span>
        )}
      </TopBar>
      {children}
    </div>
  );
}

// ── the competition screen ──────────────────────────────────────────────────

type Feedback =
  | { kind: "run"; result: JudgeResult }
  | { kind: "submit"; result: JudgeResult }
  | { kind: "error"; message: string };

function Workspace({
  state,
  round,
  now,
  token,
  connection,
}: {
  state: RoomState;
  round: RoundInfo;
  now: number;
  token: string;
  connection: ReturnType<typeof useRoom>["connection"];
}) {
  const code = state.room.code;
  const [source, setSource] = useState(() => session.draft(code, round.number) ?? round.original_code);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const chars = useMemo(() => countChars(source), [source]);
  const remaining = (round.ends_at ?? 0) - now;
  const locked = remaining <= 0;
  const best = state.me?.best_chars ?? null;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    const id = window.setTimeout(() => session.setDraft(code, round.number, source), 300);
    return () => window.clearTimeout(id);
  }, [code, round.number, source]);

  const judge = useCallback(
    async (kind: "run" | "submit") => {
      if (busy || locked) return;
      setBusy(kind);
      try {
        const fn = kind === "run" ? api.run : api.submit;
        const result = await fn(code, token, sourceRef.current);
        setFeedback({ kind, result });
      } catch (err) {
        setFeedback({ kind: "error", message: (err as Error).message });
      } finally {
        setBusy(null);
      }
    },
    [busy, locked, code, token],
  );

  return (
    <div className="flex h-dvh min-h-[640px] flex-col">
      <TopBar connection={connection}>
        <span className="hidden font-mono text-xs tracking-[0.2em] text-fog md:inline">
          ROUND <b className="text-cream">{round.number}</b> / {state.room.total_rounds}
        </span>
        <Timer remainingMs={remaining} className="text-3xl sm:text-4xl" />
        <span className="hidden sm:inline">
          <CharCounter count={chars} size="sm" />
        </span>
      </TopBar>

      <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
        {/* LEFT: problem + original */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel title={`round_${pad2(round.number)}.py`} bodyClassName="overflow-y-auto p-5">
            <h1 className="font-display text-2xl leading-tight text-cream uppercase">{round.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/85">
              <Prose text={round.description} />
            </p>
            {round.public_tests.length > 0 && (
              <div className="mt-5">
                <h3 className="label mb-2">Sample tests</h3>
                <div className="grid gap-2">
                  {round.public_tests.map((t, i) => (
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
            actions={<span className="font-mono text-[11px] text-fog">{round.original_chars} chars · read-only</span>}
            className="min-h-[200px] flex-1"
            bodyClassName="h-full"
          >
            <CodeEditor value={round.original_code} readOnly fontSize={13} className="h-full" />
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
                onClick={() => setSource(round.original_code)}
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
            <CharCounter count={chars} best={best} original={round.original_chars} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="lg" onClick={() => judge("run")} busy={busy === "run"} disabled={locked || !!busy}>
                ▶ Run
              </Button>
              <Button size="lg" onClick={() => judge("submit")} busy={busy === "submit"} disabled={locked || !!busy}>
                Submit
              </Button>
              <span className="ml-auto hidden font-mono text-[11px] text-steel xl:inline">
                ⌘↵ run · ⌘⇧↵ submit
              </span>
            </div>
            <FeedbackView feedback={feedback} locked={locked} busy={busy} seed={round.id + chars} />
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
      <div className="mt-1 flex items-center gap-2 font-mono text-xs text-fog">
        <Icon name="check" className="h-3 w-3 text-green" /> {quip(seed)}
      </div>
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

function Booting() {
  return (
    <div className="grid-bg flex min-h-dvh items-center justify-center font-mono text-sm text-fog">
      <span className="text-green">&gt;</span>&nbsp;connecting<span className="animate-blink">_</span>
    </div>
  );
}

function Gone({ message, code, forget }: { message: string; code: string; forget?: boolean }) {
  useEffect(() => {
    if (forget) session.setPlayer(code, null);
  }, [forget, code]);
  return (
    <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Mascot variant="head" className="w-24 opacity-80" />
      <p className="font-mono text-sm text-fog">
        <span className="text-danger">&gt;</span> {message.toLowerCase()}
      </p>
      <Link to={`/join?code=${code.toUpperCase()}`} className="font-mono text-sm text-green underline-offset-4 hover:underline">
        rejoin →
      </Link>
    </div>
  );
}

export { Booting, Gone };
