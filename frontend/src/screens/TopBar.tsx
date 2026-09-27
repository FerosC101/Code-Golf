import type { ReactNode } from "react";
import { Logo } from "../brand/Logo";
import type { Connection } from "../lib/useRoom";

export function TopBar({ children, connection }: { children?: ReactNode; connection?: Connection }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-line bg-ink/90 px-4 backdrop-blur-sm sm:px-6">
      <Logo />
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-8">{children}</div>
      {connection && connection !== "open" && (
        <span className="font-mono text-[11px] text-amber">
          <span className="animate-blink">●</span> {connection === "closed" ? "offline" : "reconnecting"}
        </span>
      )}
    </header>
  );
}

export function RoomBadge({ code }: { code: string }) {
  return (
    <span className="font-mono text-xs text-fog">
      ROOM <b className="tracking-[0.2em] text-cream">{code}</b>
    </span>
  );
}
