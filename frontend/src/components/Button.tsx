import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-green text-ink border-green hover:bg-[#7dff90] active:bg-green-2 shadow-[3px_3px_0_0_var(--color-deep)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
  secondary: "bg-transparent text-cream border-slate hover:border-green hover:text-green",
  danger: "bg-transparent text-danger border-danger/60 hover:bg-danger/10 hover:border-danger",
  ghost: "bg-transparent text-fog border-transparent hover:text-cream",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-10 px-4 text-xs",
  lg: "h-13 px-7 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean };

export function Button({ variant = "primary", size = "md", busy, className = "", children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-sm border font-mono font-bold tracking-[0.18em] uppercase transition-[background,color,border,transform,box-shadow] duration-100 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {busy ? <span className="animate-blink">▮</span> : null}
      {children}
    </button>
  );
}
