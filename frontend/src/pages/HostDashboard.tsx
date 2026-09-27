import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import { Timer } from "../components/Timer";
import { LibraryPicker } from "../host/LibraryPicker";
import { RoundEditor } from "../host/RoundEditor";
import { ScoringEditor } from "../host/ScoringEditor";
import { api, type RoundPayload } from "../lib/api";
import { MEDALS, clock, pad2 } from "../lib/format";
import { session } from "../lib/session";
import type { HostRound, RoomState } from "../lib/types";
import { useRoom, useServerNow } from "../lib/useRoom";
import { Leaderboard } from "../screens/Leaderboard";
import { RoomBadge, TopBar } from "../screens/TopBar";
import { Booting } from "./Play";

type Editing = { mode: "new" } | { mode: "edit"; round: HostRound } | { mode: "library" } | null;
type Verify = Record<number, { busy?: boolean; text?: string; ok?: boolean }>;

export default function HostDashboard() {
  const { code = "" } = useParams();
  const token = session.hostToken(code);
  const { state, events, connection, fatal, serverNow } = useRoom(code, { token });
  const now = useServerNow(serverNow, 250);
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verify, setVerify] = useState<Verify>({});
  const [openSub, setOpenSub] = useState<number | null>(null);

  if (!token) {
    return (
      <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center font-mono text-sm text-fog">
        <Mascot variant="head" className="w-20" />
        <p>
          <span className="text-danger">&gt;</span> no host key for room {code.toUpperCase()} on this device.
        </p>
        <Link to="/host" className="text-green hover:underline">
          create a new room →
        </Link>
      </div>
    );
  }
  if (fatal) return <div className="p-10 font-mono text-danger">&gt; {fatal}</div>;
  if (!state || !state.host) return <Booting />;

  const host = state.host;
  const room = state.room;
  const round = state.round;
  const starting = room.status === "active" && round?.starts_at != null && now < round.starts_at;
  const live = room.status === "active" && !starting;
  const nextRound = host.rounds.find((r) => r.status === "pending");
  const statusLabel = { lobby: "READY", active: starting ? "COUNTDOWN" : "LIVE", results: "RESULTS", finished: "FINISHED" }[room.status];

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveRound(data: RoundPayload) {
    if (editing?.mode === "edit") await api.updateRound(room.code, token!, editing.round.id, data);
    else await api.addRound(room.code, token!, data);
    setEditing(null);
  }

  async function runVerify(r: HostRound) {
    setVerify((v) => ({ ...v, [r.id]: { busy: true } }));
    try {
      const res = await api.verifyRound(room.code, token!, r.id);
      const bad = res.results.map((x, i) => (x.status === "passed" ? null : `#${i + 1} ${x.status}`)).filter(Boolean);
      setVerify((v) => ({
        ...v,
        [r.id]: { ok: res.passed, text: res.passed ? `original passes ${res.results.length}/${res.results.length}` : `fails ${bad.join(", ")}` },
      }));
    } catch (err) {
      setVerify((v) => ({ ...v, [r.id]: { ok: false, text: (err as Error).message.toLowerCase() } }));
    }
  }

  const joinUrl = `${location.origin}/join?code=${room.code}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar connection={connection}>
        <span className="hidden truncate font-mono text-xs text-fog md:inline">{room.name}</span>
        <RoomBadge code={room.code} />
        <Link to={`/watch/${room.code}`} target="_blank" className="font-mono text-xs text-fog hover:text-green">
          projector view ↗
        </Link>
      </TopBar>

      <main className="grid flex-1 gap-3 p-3 xl:grid-cols-[300px_1fr_340px]">
        {/* ── left: control ───────────────────────────── */}
        <div className="flex flex-col gap-3">
          <Panel title="Room control" chrome>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-4 pt-4 font-mono text-[13px]">
              <dt className="text-fog">Room code</dt>
              <dd className="font-display text-lg leading-5 tracking-[0.2em] text-cream">{room.code}</dd>
              <dt className="text-fog">Players</dt>
              <dd className="text-cream">
                {state.players.filter((p) => p.connected).length}
                <span className="text-fog"> / {state.players.length}</span>
              </dd>
              <dt className="text-fog">Round</dt>
              <dd className="text-cream">
                {room.current_round} / {room.total_rounds}
              </dd>
            </dl>
            <div className="mt-4 border-t border-slate px-4 py-4">
              <div className="label">Status</div>
              <div className="mt-1 flex items-center justify-between">
                <span className={`font-display text-2xl ${live ? "text-green" : "text-cream"}`}>{statusLabel}</span>
                {round && room.status === "active" && round.ends_at && (
                  <Timer remainingMs={starting ? round.starts_at! - now : round.ends_at - now} className="text-2xl" />
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {(room.status === "lobby" || room.status === "results") && nextRound && (
                  <Button size="lg" busy={busy === "start"} onClick={() => act("start", () => api.start(room.code, token))}>
                    ▶ Start round {nextRound.number}
                  </Button>
                )}
                {room.status === "active" && (
                  <Button
                    variant="danger"
                    busy={busy === "end"}
                    onClick={() => confirm("End this round now and lock submissions?") && act("end", () => api.end(room.code, token))}
                  >
                    ■ End round now
                  </Button>
                )}
                {room.status === "results" && (
                  <Button
                    variant={nextRound ? "secondary" : "primary"}
                    size={nextRound ? "md" : "lg"}
                    busy={busy === "finish"}
                    onClick={() =>
                      (!nextRound || confirm("Skip the remaining rounds and show the final podium?")) &&
                      act("finish", () => api.finish(room.code, token))
                    }
                  >
                    🏆 Final results
                  </Button>
                )}
                {room.status === "lobby" && !nextRound && <p className="font-mono text-xs text-fog">&gt; add a round to start.</p>}
              </div>
              {error && <p className="mt-3 font-mono text-xs text-danger">&gt; {error.toLowerCase()}</p>}
            </div>
            <div className="border-t border-slate px-4 py-3">
              <div className="label mb-1">Invite</div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(joinUrl)}
                className="w-full truncate text-left font-mono text-xs text-green hover:underline"
                title="Copy join link"
              >
                {joinUrl.replace(/^https?:\/\//, "")}
              </button>
            </div>
          </Panel>

          <Panel title={`Connected players · ${state.players.length}`} bodyClassName="max-h-80 overflow-y-auto">
            {state.players.length === 0 ? (
              <p className="p-4 font-mono text-xs text-fog">&gt; waiting for players to join {room.code}...</p>
            ) : (
              <table className="w-full font-mono text-[13px]">
                <tbody>
                  {state.players.map((p, i) => (
                    <tr key={p.id} className="group border-b border-line last:border-0">
                      <td className="w-8 py-1.5 pl-3 text-steel">{pad2(i + 1)}</td>
                      <td className={`truncate py-1.5 ${p.connected ? "text-cream" : "text-steel"}`}>{p.name}</td>
                      <td className="py-1.5 text-right text-fog tabular-nums">{p.points}</td>
                      <td className="w-6 py-1.5 text-center">
                        <span className={`inline-block h-1.5 w-1.5 ${p.connected ? "bg-green" : "bg-steel"}`} />
                      </td>
                      <td className="w-8 py-1.5 pr-2 text-right">
                        <button
                          type="button"
                          className="text-steel opacity-0 group-hover:opacity-100 hover:text-danger"
                          title={`Remove ${p.name}`}
                          onClick={() => confirm(`Remove ${p.name} from the room?`) && act("kick", () => api.kick(room.code, token, p.id))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Scoring">
            <ScoringEditor scoring={room.scoring} onSave={async (s) => void (await api.updateRoom(room.code, token, { scoring: s }))} />
          </Panel>
        </div>

        {/* ── centre: rounds + submissions ────────────── */}
        <div className="flex min-w-0 flex-col gap-3">
          {editing?.mode === "library" ? (
            <Panel title="Problem library" chrome>
              <LibraryPicker
                queued={new Set(host.rounds.map((r) => r.title))}
                onAdd={async (slugs) => {
                  await api.addLibraryRounds(room.code, token!, slugs);
                  setEditing(null);
                }}
                onClose={() => setEditing(null)}
              />
            </Panel>
          ) : editing ? (
            <Panel title={editing.mode === "new" ? "New round" : `Edit round ${editing.round.number}`} chrome>
              <RoundEditor round={editing.mode === "edit" ? editing.round : undefined} onSave={saveRound} onCancel={() => setEditing(null)} />
            </Panel>
          ) : (
            <Panel
              title={`Rounds · ${host.rounds.length}`}
              actions={
                room.status !== "finished" && (
                  <>
                    {host.rounds.length === 0 && (
                      <Button size="sm" variant="secondary" busy={busy === "pack"} onClick={() => act("pack", () => api.addPack(room.code, token, "starter"))}>
                        Starter pack
                      </Button>
                    )}
                    <Button size="sm" variant="danger" busy={busy === "nightmare"} onClick={() => act("nightmare", () => api.addPack(room.code, token, "nightmare"))}>
                      + Nightmare
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ mode: "library" })}>
                      Library
                    </Button>
                    <Button size="sm" onClick={() => setEditing({ mode: "new" })}>
                      + Custom round
                    </Button>
                  </>
                )
              }
              bodyClassName="overflow-x-auto"
            >
              {host.rounds.length === 0 ? (
                <p className="p-6 font-mono text-sm text-fog">&gt; no rounds yet. pick from the library, write your own, or load the starter pack.</p>
              ) : (
                <table className="w-full min-w-[640px] font-mono text-[13px]">
                  <thead>
                    <tr className="border-b border-slate text-left text-[10px] tracking-[0.2em] text-fog uppercase">
                      <th className="w-10 py-2 pl-3 font-normal">#</th>
                      <th className="py-2 font-normal">Problem</th>
                      <th className="py-2 font-normal">Timer</th>
                      <th className="py-2 font-normal">Chars</th>
                      <th className="py-2 font-normal">Tests</th>
                      <th className="py-2 font-normal">Status</th>
                      <th className="py-2 pr-3 text-right font-normal">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {host.rounds.map((r) => {
                      const hidden = r.tests.filter((t) => t.hidden).length;
                      const v = verify[r.id];
                      return (
                        <tr key={r.id} className={`border-b border-line align-top last:border-0 ${r.status === "active" ? "bg-deep/40" : ""}`}>
                          <td className="py-2 pl-3 text-steel">{pad2(r.number)}</td>
                          <td className="py-2 pr-3">
                            <div className="text-cream">{r.title}</div>
                            {v && (
                              <div className={`text-[11px] ${v.busy ? "text-fog" : v.ok ? "text-green" : "text-danger"}`}>
                                &gt; {v.busy ? "running original..." : v.text}
                              </div>
                            )}
                          </td>
                          <td className="py-2 text-fog">{clock(r.duration_seconds * 1000)}</td>
                          <td className="py-2 text-fog">{r.original_chars}</td>
                          <td className="py-2 text-fog">
                            {r.tests.length - hidden}
                            <span className="text-steel">p</span> {hidden}
                            <span className="text-steel">h</span>
                          </td>
                          <td className="py-2">
                            <span className={r.status === "active" ? "text-green" : r.status === "closed" ? "text-steel" : "text-cream"}>
                              {r.status === "active" ? "LIVE" : r.status === "closed" ? "DONE" : "QUEUED"}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right whitespace-nowrap">
                            <button type="button" className="text-fog hover:text-green" onClick={() => runVerify(r)}>
                              verify
                            </button>
                            {r.status === "pending" && (
                              <>
                                <button type="button" className="ml-3 text-fog hover:text-cream" onClick={() => setEditing({ mode: "edit", round: r })}>
                                  edit
                                </button>
                                <button
                                  type="button"
                                  className="ml-3 text-steel hover:text-danger"
                                  onClick={() => confirm(`Delete "${r.title}"?`) && act("del", () => api.deleteRound(room.code, token, r.id))}
                                >
                                  del
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>
          )}

          <Panel
            title={round ? `Submissions · round ${pad2(round.number)} · ${host.submissions.length}` : "Submissions"}
            className="min-h-64 flex-1"
            bodyClassName="overflow-auto"
          >
            {host.submissions.length === 0 ? (
              <p className="p-6 font-mono text-sm text-fog">
                &gt; {room.status === "active" ? "no submissions yet. keys clacking..." : "submissions show up here live."}
              </p>
            ) : (
              <table className="w-full font-mono text-[13px]">
                <thead>
                  <tr className="border-b border-slate text-left text-[10px] tracking-[0.2em] text-fog uppercase">
                    <th className="py-2 pl-3 font-normal">Time</th>
                    <th className="py-2 font-normal">Player</th>
                    <th className="py-2 font-normal">Chars</th>
                    <th className="py-2 font-normal">Result</th>
                    <th className="py-2 pr-3 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {host.submissions.map((s) => (
                    <SubmissionRow
                      key={s.id}
                      sub={s}
                      startsAt={round?.starts_at ?? s.submitted_at}
                      open={openSub === s.id}
                      onToggle={() => setOpenSub(openSub === s.id ? null : s.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* ── right: rankings ─────────────────────────── */}
        <div className="flex flex-col gap-3">
          <Panel title={room.status === "active" ? "Live ranking" : "Round ranking"}>
            <RoundRanking state={state} />
          </Panel>
          <Panel title="Overall leaderboard" bodyClassName="px-3 py-1">
            <Leaderboard entries={state.leaderboard} dense />
          </Panel>
          <Panel title="Log" bodyClassName="max-h-56 overflow-y-auto px-3 py-2">
            <div className="space-y-0.5 font-mono text-[11px] text-fog">
              {events.length === 0 && <p>&gt; listening on room {room.code}</p>}
              {[...events].reverse().map((e) => (
                <p key={`${e.at}${e.text}`}>
                  <span className="text-steel">{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>{" "}
                  <span className={e.passed === false ? "text-danger" : "text-green"}>&gt;</span> {e.text}
                </p>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function SubmissionRow({
  sub,
  startsAt,
  open,
  onToggle,
}: {
  sub: NonNullable<RoomState["host"]>["submissions"][number];
  startsAt: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-line">
        <td className="py-1.5 pl-3 text-steel tabular-nums">+{clock(Math.max(0, sub.submitted_at - startsAt))}</td>
        <td className="py-1.5 text-cream">{sub.name}</td>
        <td className="py-1.5 text-cream tabular-nums">{sub.chars}</td>
        <td className={`py-1.5 ${sub.passed ? "text-green" : "text-danger"}`}>{sub.passed ? "✓ PASS" : "✗ FAIL"}</td>
        <td className="py-1.5 pr-3 text-right">
          <button type="button" onClick={onToggle} className="text-fog hover:text-cream">
            {open ? "hide" : "code"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line bg-ink">
          <td colSpan={5} className="px-3 py-2">
            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-cream">{sub.code}</pre>
          </td>
        </tr>
      )}
    </>
  );
}

function RoundRanking({ state }: { state: RoomState }) {
  const host = state.host!;
  const liveRows = useMemo(() => {
    const names = new Map(state.players.map((p) => [p.id, p.name]));
    const rows = Object.entries(host.best)
      .map(([id, chars]) => ({ id: Number(id), name: names.get(Number(id)) ?? "?", chars }))
      .sort((a, b) => a.chars - b.chars);
    let rank = 0;
    return rows.map((r, i) => {
      if (i === 0 || r.chars !== rows[i - 1].chars) rank = i + 1;
      return { ...r, rank };
    });
  }, [host.best, state.players]);

  if (state.room.status === "active") {
    if (!liveRows.length) return <p className="p-4 font-mono text-xs text-fog">&gt; no valid submissions yet.</p>;
    return (
      <ol className="px-3 py-1 font-mono text-[13px]">
        {liveRows.map((r) => (
          <li key={r.id} className="grid grid-cols-[2rem_1fr_auto_3rem] gap-2 border-b border-line py-1.5 last:border-0">
            <span>{MEDALS[r.rank] ?? <span className="text-steel">{r.rank}</span>}</span>
            <span className="truncate text-cream">{r.name}</span>
            <span className="text-cream tabular-nums">{r.chars}</span>
            <span className="text-right text-green">+{pointsFor(r.rank, state.room.scoring)}</span>
          </li>
        ))}
      </ol>
    );
  }
  const res = state.results;
  if (!res) return <p className="p-4 font-mono text-xs text-fog">&gt; rankings appear once a round starts.</p>;
  return (
    <ol className="px-3 py-1 font-mono text-[13px]">
      {res.entries.map((e) => (
        <li key={e.player_id} className="grid grid-cols-[2rem_1fr_auto_3rem] gap-2 border-b border-line py-1.5 last:border-0">
          <span>{e.rank ? MEDALS[e.rank] ?? <span className="text-steel">{e.rank}</span> : <span className="text-steel">–</span>}</span>
          <span className={`truncate ${e.rank ? "text-cream" : "text-steel"}`}>{e.name}</span>
          <span className={e.status === "valid" ? "text-cream tabular-nums" : "text-[11px] text-danger"}>
            {e.status === "valid" ? e.chars : e.status === "failed" ? "FAIL" : "—"}
          </span>
          <span className="text-right text-green">+{e.points}</span>
        </li>
      ))}
    </ol>
  );
}

function pointsFor(rank: number, scoring: number[]) {
  return scoring.length ? scoring[Math.min(rank, scoring.length) - 1] : 0;
}
