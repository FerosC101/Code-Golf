type Props = {
  children: React.ReactNode;
  tone?: "cream" | "green" | "dark";
  tilt?: number;
  className?: string;
};

/** Die-cut sticker badge: "SHORTER IS BETTER", "PYTHON CRIMES DETECTED." */
export function Sticker({ children, tone = "cream", tilt = -4, className = "" }: Props) {
  const tones = {
    cream: "bg-cream text-ink",
    green: "bg-green text-ink",
    dark: "bg-ink-2 text-green",
  };
  return (
    <span
      className={`inline-block rounded-md border-2 border-ink px-3 py-1.5 font-display text-[13px] leading-tight uppercase shadow-[0_0_0_3px_var(--color-cream),4px_5px_0_3px_rgb(0_0_0/0.45)] ${tones[tone]} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  );
}
