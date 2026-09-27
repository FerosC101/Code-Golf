type Props = { className?: string; cursor?: boolean };

/** The `>_` terminal prompt. The underscore is a blinking cursor. */
export function Prompt({ className = "", cursor = true }: Props) {
  return (
    <span className={`font-mono font-bold text-green select-none ${className}`} aria-hidden>
      &gt;<span className={cursor ? "animate-blink" : ""}>_</span>
    </span>
  );
}
