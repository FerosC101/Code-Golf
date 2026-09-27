import { pad2 } from "../lib/format";
import type { LeaderboardEntry } from "../lib/types";

function Movement({ value }: { value: number | null }) {
  if (value == null || value === 0) return <span className="text-steel">—</span>;
  return value > 0 ? <span className="text-green">↑ {value}</span> : <span className="text-danger">↓ {-value}</span>;
}

/** GAME LEADERBOARD: 01 Vince — 28 pts ↑1 */
export function Leaderboard({ entries, highlight, dense }: { entries: LeaderboardEntry[]; highlight?: number; dense?: boolean }) {
  if (!entries.length) return <p className="font-mono text-sm text-fog">&gt; no players yet.</p>;
  return (
    <ol className="divide-y divide-line font-mono">
      {entries.map((e, i) => (
        <li
          key={e.player_id}
          className={`grid grid-cols-[2.5rem_1fr_auto_3.5rem] items-center gap-3 ${dense ? "py-1.5 text-[13px]" : "py-3 text-base"} animate-rise ${e.player_id === highlight ? "bg-deep/40" : ""}`}
          style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
        >
          <span className={`tabular-nums ${e.rank === 1 ? "text-green" : "text-steel"}`}>{pad2(e.rank)}</span>
          <span className={`truncate ${e.rank === 1 ? "text-cream font-bold" : "text-cream"}`}>
            {e.name}
            {e.player_id === highlight && <span className="ml-2 text-[11px] text-fog">(you)</span>}
          </span>
          <span className="tabular-nums text-cream">
            <b>{e.points}</b> <span className="text-fog text-xs">pts</span>
          </span>
          <span className="text-right text-xs tabular-nums">
            <Movement value={e.movement} />
          </span>
        </li>
      ))}
    </ol>
  );
}
