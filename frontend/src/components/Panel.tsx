import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  actions?: ReactNode;
  /** Terminal traffic-light dots in the title bar. */
  chrome?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/** Structured panel with a thin terminal-style header. Not a rounded "card". */
export function Panel({ title, actions, chrome, className = "", bodyClassName = "", children }: Props) {
  return (
    <section className={`flex min-h-0 flex-col rounded-md border border-slate bg-ink-2 ${className}`}>
      {(title || actions || chrome) && (
        <header className="flex h-9 shrink-0 items-center gap-3 border-b border-slate px-3">
          {chrome && (
            <span className="flex gap-1.5" aria-hidden>
              <i className="h-2 w-2 rounded-full bg-danger/80" />
              <i className="h-2 w-2 rounded-full bg-amber/80" />
              <i className="h-2 w-2 rounded-full bg-green/80" />
            </span>
          )}
          {title && <h2 className="label truncate">{title}</h2>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
