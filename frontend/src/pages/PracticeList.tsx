import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { Mascot } from "../brand/Mascot";
import { Icon } from "../brand/icons";
import { parLabel } from "../components/Workbench";
import { pad2 } from "../lib/format";
import { session } from "../lib/session";
import type { Difficulty } from "../lib/types";
import { useLibrary } from "../lib/useLibrary";

const FILTERS: ("all" | Difficulty)[] = ["all", "easy", "medium", "hard"];
export const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "text-green border-green/40",
  medium: "text-amber border-amber/40",
  hard: "text-danger border-danger/40",
};

export default function PracticeList() {
  const { problems, error } = useLibrary();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const bests = useMemo(
    () => Object.fromEntries((problems ?? []).map((p) => [p.slug, session.practiceBest(p.slug)])),
    [problems],
  );
  const played = Object.values(bests).filter((b) => b != null).length;
  const underPar = (problems ?? []).filter((p) => bests[p.slug] != null && bests[p.slug]! < p.par).length;
  const shown = (problems ?? []).map((p, i) => ({ ...p, hole: i + 1 })).filter((p) => filter === "all" || p.difficulty === filter);

  return (
    <div className="grid-bg min-h-dvh">
      <header className="flex h-14 items-center gap-6 border-b border-line px-5 sm:px-8">
        <Logo />
        <nav className="ml-auto flex gap-5 font-mono text-xs text-fog">
          <Link to="/join" className="hover:text-green">join game</Link>
          <Link to="/host" className="hover:text-green">host</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <section className="flex flex-wrap items-end justify-between gap-6 animate-rise">
          <div>
            <div className="font-mono text-xs text-fog">
              <span className="text-green">&gt;</span> solo mode
            </div>
            <h1 className="mt-2 font-display text-4xl text-cream sm:text-6xl">
              PRACTICE <span className="text-green">RANGE</span>
            </h1>
            <p className="mt-3 max-w-lg font-mono text-sm leading-6 text-fog">
              No clock. No crowd. Pick a hole, make it shorter, make it work.
              Beat <b className="text-cream">par</b> to go under.
            </p>
          </div>
          <div className="flex items-end gap-8">
            <Stat label="Holes played" value={`${played}/${problems?.length ?? "–"}`} />
            <Stat label="Under par" value={underPar} accent />
            <Mascot variant="head" idle className="hidden w-16 sm:block" />
          </div>
        </section>

        <div className="mt-10 flex gap-1 border-b border-slate" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`-mb-px border-b-2 px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors ${
                filter === f ? "border-green text-green" : "border-transparent text-fog hover:text-cream"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <p className="py-8 font-mono text-sm text-danger">&gt; {error.toLowerCase()}</p>}
        {!problems && !error && (
          <p className="py-8 font-mono text-sm text-fog">
            &gt; loading holes<span className="animate-blink">_</span>
          </p>
        )}

        <ol className="divide-y divide-line">
          {shown.map((p, i) => {
            const best = bests[p.slug];
            const score = best != null ? parLabel(best, p.par) : null;
            return (
              <li key={p.slug} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <Link
                  to={`/practice/${p.slug}`}
                  className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[4.5rem_1fr_6rem_5rem_5rem_9rem]"
                >
                  <span className="font-mono text-xs text-steel">
                    HOLE
                    <span className="block font-display text-xl text-fog group-hover:text-green">{pad2(p.hole)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg text-cream group-hover:text-green">{p.title}</span>
                    <span className="block truncate text-sm text-fog">{p.description.replace(/`/g, "")}</span>
                  </span>
                  <span className={`justify-self-end rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] uppercase sm:justify-self-start ${DIFFICULTY_TONE[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                  <span className="hidden font-mono text-xs text-fog sm:block">
                    orig <b className="text-cream">{p.original_chars}</b>
                  </span>
                  <span className="hidden font-mono text-xs text-fog sm:block">
                    par <b className="text-cream">{p.par}</b>
                  </span>
                  <span className="col-start-2 font-mono text-xs sm:col-start-auto sm:text-right">
                    {score ? (
                      <>
                        <b className="text-cream">{best}</b> <span className={score.tone}>{score.text}</span>
                      </>
                    ) : (
                      <span className="text-steel">not played</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <p className="mt-10 flex items-center gap-2 font-mono text-[11px] text-steel">
          <Icon name="flag" className="h-3 w-3 text-green" /> scores are saved in this browser only.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={`font-display text-3xl ${accent ? "text-green" : "text-cream"}`}>{value}</div>
    </div>
  );
}
