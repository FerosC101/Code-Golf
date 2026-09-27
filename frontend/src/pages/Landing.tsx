import { Link } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { Prompt } from "../brand/Prompt";
import { Sticker } from "../brand/Sticker";
import { Wordmark } from "../brand/Wordmark";
import { Icon, type IconName } from "../brand/icons";
import { pad2 } from "../lib/format";
import { session } from "../lib/session";
import type { Difficulty } from "../lib/types";
import { useLibrary } from "../lib/useLibrary";
import { DIFFICULTY_TONE } from "./PracticeList";

const FEATURES: { icon: IconName; label: [string, string]; tint: string }[] = [
  { icon: "python", label: ["PYTHON", "ONLY"], tint: "" },
  { icon: "less", label: ["LESS", "CHARACTERS"], tint: "text-cream" },
  { icon: "bolt", label: ["LIVE", "ROUNDS"], tint: "text-cream" },
  { icon: "trophy", label: ["RANK", "& SCORE"], tint: "text-cream" },
];

// Floating syntax around the mascot, like dust in an old arcade cabinet.
const GLYPHS = [
  { t: "{ }", c: "left-[0%] top-[12%]", d: "0s" },
  { t: "{ }", c: "right-[6%] top-[4%]", d: "1.1s" },
  { t: ";", c: "left-[2%] top-[46%]", d: "0.6s" },
  { t: "}", c: "right-[2%] top-[34%]", d: "1.7s" },
  { t: "{ :", c: "right-[12%] top-[56%]", d: "0.3s" },
];

export default function Landing() {
  return (
    <div className="grid-bg flex min-h-dvh flex-col">
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pt-12 pb-8 md:grid-cols-[1fr_1.05fr] md:gap-6 md:px-8 md:pt-16">
        <section className="animate-rise">
          <Prompt className="text-3xl" />
          <h1 className="mt-5">
            <Wordmark className="w-full max-w-[17rem] sm:max-w-[26rem]" />
          </h1>
          <p className="mt-9 font-mono text-xl leading-relaxed tracking-[0.3em] text-cream sm:text-2xl">
            MAKE IT SHORTER.
            <br />
            MAKE IT WORK.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/join"
              className="inline-flex h-12 items-center rounded-sm border border-green bg-green px-4 font-mono text-[13px] font-bold tracking-[0.1em] text-ink shadow-[4px_4px_0_0_var(--color-deep)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ JOIN GAME ]
            </Link>
            <Link
              to="/host"
              className="inline-flex h-12 items-center rounded-sm border border-slate px-4 font-mono text-[13px] font-bold tracking-[0.1em] text-cream transition-colors hover:border-green hover:text-green"
            >
              [ HOST A GAME ]
            </Link>
            <Link
              to="/practice"
              className="inline-flex h-12 items-center rounded-sm border border-slate px-4 font-mono text-[13px] font-bold tracking-[0.1em] text-cream transition-colors hover:border-green hover:text-green"
            >
              [ PRACTICE ]
            </Link>
          </div>
          <p className="mt-8 font-mono text-xs tracking-[0.2em] text-green/80">
            [ PYTHON <span className="text-steel">|</span> LESS CHARACTERS <span className="text-steel">|</span> MORE CHAOS ]
          </p>
        </section>

        <section className="relative mx-auto w-full max-w-[34rem] animate-rise [animation-delay:150ms]" aria-hidden>
          {GLYPHS.map((g, i) => (
            <span
              key={i}
              className={`absolute font-mono text-2xl font-bold text-green/70 animate-float ${g.c}`}
              style={{ animationDelay: g.d }}
            >
              {g.t}
            </span>
          ))}
          <Icon name="crown" className="absolute top-[-9%] left-[64%] h-6 w-12 rotate-12 text-green/80" />
          <Mascot className="relative w-full" idle />
        </section>
      </main>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-9 md:grid-cols-[repeat(4,1fr)_1.3fr] md:px-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.icon}
              className={`flex flex-col items-center gap-3 text-center ${i > 0 ? "md:border-l md:border-line" : ""}`}
            >
              <Icon name={f.icon} className={`h-9 w-9 ${f.tint}`} />
              <span className="font-mono text-xs leading-5 tracking-[0.18em] text-cream">
                {f.label[0]}
                <br />
                {f.label[1]}
              </span>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-center md:col-span-1 md:border-l md:border-line md:pl-8">
            <p className="font-mono text-lg leading-8 tracking-[0.35em] text-cream">
              EVERY
              <br />
              CHARACTER
              <br />
              COUNTS.
              <span className="mt-2 block h-[3px] w-8 bg-green" />
            </p>
          </div>
        </div>
      </section>

      <Course />

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[1.2fr_1fr] md:px-8">
          <div className="rounded-md border border-slate bg-ink-2">
            <div className="flex gap-1.5 border-b border-slate px-3 py-2.5" aria-hidden>
              <i className="h-2 w-2 rounded-full bg-danger/80" />
              <i className="h-2 w-2 rounded-full bg-amber/80" />
              <i className="h-2 w-2 rounded-full bg-green/80" />
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 text-fog">
              <span className="text-cream"># before · 84 chars</span>
              {"\n"}def is_palindrome(text):{"\n"}    return text == text[::-1]{"\n"}print(is_palindrome(input())){"\n\n"}
              <span className="text-cream"># after · 27 chars</span>
              {"\n"}
              <span className="text-green">s=input();print(s==s[::-1])</span>
              {"\n\n"}
              <span className="text-green">&gt;</span> tests passed. <span className="text-green">57 characters saved.</span>
            </pre>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 py-4">
            <Sticker tilt={-7}>Shorter is better</Sticker>
            <Sticker tone="green" tilt={5}>One liner.</Sticker>
            <Sticker tone="dark" tilt={-3}>No whitespace.</Sticker>
            <Sticker tilt={3}>Python crimes detected.</Sticker>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-5 text-center font-mono text-[11px] text-steel">
        &gt;_ code golf · built for game nights · no accounts, no tracking, no mercy
      </footer>
    </div>
  );
}

const LEVELS: { level: Difficulty; blurb: string }[] = [
  { level: "easy", blurb: "one-liners waiting to happen" },
  { level: "medium", blurb: "loops worth unrolling" },
  { level: "hard", blurb: "full python crimes" },
  { level: "nightmare", blurb: "confusing on purpose" },
];

/** Every problem in the library, grouped by difficulty; each links into practice. */
function Course() {
  const { problems, error } = useLibrary();
  if (error) return null; // the landing page shouldn't break if the API is down
  const numbered = (problems ?? []).map((p, i) => ({ ...p, hole: i + 1 }));

  return (
    <section className="border-t border-line" aria-labelledby="course-heading">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="label">The course</div>
            <h2 id="course-heading" className="mt-2 font-display text-3xl text-cream sm:text-4xl">
              {problems ? problems.length : "··"} HOLES. <span className="text-green">PICK YOUR POISON.</span>
            </h2>
            <p className="mt-2 max-w-xl font-mono text-sm leading-6 text-fog">
              Hosts queue them up as rounds. Or play them solo on the practice range: no clock, just you versus par.
            </p>
          </div>
          <Link
            to="/practice"
            className="inline-flex h-11 items-center rounded-sm border border-green px-5 font-mono text-xs font-bold tracking-[0.2em] text-green transition-colors hover:bg-green hover:text-ink"
          >
            [ OPEN PRACTICE RANGE ]
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map(({ level, blurb }) => {
            const holes = numbered.filter((p) => p.difficulty === level);
            return (
              <div key={level} className="rounded-md border border-slate bg-ink-2">
                <div className="flex items-center justify-between gap-3 border-b border-slate px-4 py-3">
                  <span className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] uppercase ${DIFFICULTY_TONE[level]}`}>
                    {level}
                  </span>
                  <span className="text-right font-mono text-[11px] leading-4 text-fog">
                    {problems ? `${holes.length} holes · ` : ""}
                    {blurb}
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {!problems &&
                    Array.from({ length: 4 }, (_, i) => (
                      <li key={i} className="px-4 py-2.5 font-mono text-xs text-steel">
                        &gt; loading<span className="animate-blink">_</span>
                      </li>
                    ))}
                  {holes.map((p) => {
                    const best = session.practiceBest(p.slug);
                    return (
                      <li key={p.slug}>
                        <Link to={`/practice/${p.slug}`} className="group flex items-center gap-3 px-4 py-2.5 font-mono text-[13px] hover:bg-ink-3">
                          <span className="w-5 text-steel">{pad2(p.hole)}</span>
                          <span className="flex-1 truncate text-cream group-hover:text-green">{p.title}</span>
                          {best != null && (
                            <span className={best < p.par ? "text-green" : "text-fog"} title="your best">
                              {best}
                            </span>
                          )}
                          <span className="text-[11px] text-fog">
                            par <b className="text-cream">{p.par}</b>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
