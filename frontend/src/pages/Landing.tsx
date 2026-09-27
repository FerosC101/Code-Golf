import { Link } from "react-router-dom";
import { Mascot } from "../brand/Mascot";
import { Prompt } from "../brand/Prompt";
import { Sticker } from "../brand/Sticker";
import { Wordmark } from "../brand/Wordmark";
import { Icon, type IconName } from "../brand/icons";

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
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/join"
              className="inline-flex h-13 items-center rounded-sm border border-green bg-green px-7 font-mono text-sm font-bold tracking-[0.2em] text-ink shadow-[4px_4px_0_0_var(--color-deep)] transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              [ JOIN GAME ]
            </Link>
            <Link
              to="/host"
              className="inline-flex h-13 items-center rounded-sm border border-slate px-7 font-mono text-sm font-bold tracking-[0.2em] text-cream transition-colors hover:border-green hover:text-green"
            >
              [ HOST A GAME ]
            </Link>
          </div>
          <p className="mt-5 font-mono text-xs text-fog">
            no game tonight?{" "}
            <Link to="/practice" className="text-green underline-offset-4 hover:underline">
              warm up on the practice range →
            </Link>
          </p>
          <p className="mt-6 font-mono text-xs tracking-[0.2em] text-green/80">
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
