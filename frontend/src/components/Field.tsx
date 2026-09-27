import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-sm border border-slate bg-ink px-3 font-mono text-cream placeholder:text-steel outline-none transition-colors focus:border-green focus:shadow-[0_0_0_1px_var(--color-green)]";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && <span className="label mb-2 block">{label}</span>}
      <input ref={ref} id={inputId} {...rest} className={`${base} h-11 ${className}`} />
      {hint && <span className="mt-1.5 block font-mono text-[11px] text-fog">{hint}</span>}
    </label>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };

export function TextArea({ label, className = "", ...rest }: AreaProps) {
  return (
    <label className="block">
      {label && <span className="label mb-2 block">{label}</span>}
      <textarea {...rest} className={`${base} resize-y py-2 text-[13px] leading-relaxed ${className}`} />
    </label>
  );
}
