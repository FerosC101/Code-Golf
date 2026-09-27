import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { CharCounter } from "../components/CharCounter";
import { Workbench, parLabel } from "../components/Workbench";
import { api } from "../lib/api";
import { pad2 } from "../lib/format";
import { session } from "../lib/session";
import type { PracticeProblem } from "../lib/types";
import { useLibrary } from "../lib/useLibrary";
import { TopBar } from "../screens/TopBar";
import { Booting } from "./Play";
import { DIFFICULTY_TONE } from "./PracticeList";

export default function PracticeHole() {
  const { slug = "" } = useParams();
  const { problems } = useLibrary();
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [best, setBest] = useState<number | null>(() => session.practiceBest(slug));

  useEffect(() => {
    setProblem(null);
    setError(null);
    setBest(session.practiceBest(slug));
    api.practiceProblem(slug).then(setProblem, (err: Error) => setError(err.message));
  }, [slug]);

  const judge = useCallback(
    async (kind: "run" | "submit", source: string) => {
      const result = await api.practice(slug, kind, source);
      if (kind === "submit" && result.passed) {
        // Personal bests live in the browser: no accounts in practice.
        const previous = session.practiceBest(slug);
        result.previous_best = previous;
        if (previous == null || result.chars < previous) {
          session.setPracticeBest(slug, result.chars);
          setBest(result.chars);
        }
      }
      return result;
    },
    [slug],
  );

  if (error) {
    return (
      <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center font-mono text-sm text-fog">
        <Mascot variant="head" className="w-20" />
        <p>
          <span className="text-danger">&gt;</span> {error.toLowerCase()}
        </p>
        <Link to="/practice" className="text-green hover:underline">
          ← back to the range
        </Link>
      </div>
    );
  }
  if (!problem) return <Booting />;

  const index = problems?.findIndex((p) => p.slug === slug) ?? -1;
  const hole = index >= 0 ? index + 1 : null;
  const next = problems && index >= 0 ? problems[index + 1] : undefined;
  const score = best != null ? parLabel(best, problem.par) : null;

  return (
    <Workbench
      key={slug}
      problem={{ ...problem, fileName: hole ? `hole_${pad2(hole)}.py` : `${slug}.py` }}
      draftKey={`cg:practice:draft:${slug}`}
      best={best}
      judge={judge}
      seed={problem.par}
      header={(chars) => (
        <TopBar>
          <Link to="/practice" className="hidden font-mono text-xs text-fog hover:text-green md:inline">
            ← range
          </Link>
          <span className={`hidden rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] uppercase sm:inline ${DIFFICULTY_TONE[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="font-mono text-xs tracking-[0.2em] text-fog">
            PAR <b className="font-display text-2xl text-cream">{problem.par}</b>
          </span>
          {score && (
            <span className={`hidden font-mono text-xs lg:inline ${score.tone}`}>
              best {best} · {score.text}
            </span>
          )}
          <span className="hidden sm:inline">
            <CharCounter count={chars} size="sm" />
          </span>
          {next && (
            <Link to={`/practice/${next.slug}`} className="font-mono text-xs text-fog hover:text-green">
              next hole →
            </Link>
          )}
        </TopBar>
      )}
    />
  );
}
