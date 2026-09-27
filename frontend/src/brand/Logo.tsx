import { Link } from "react-router-dom";
import { Prompt } from "./Prompt";

/** Compact `>_ CODE GOLF` lockup for headers. */
export function Logo({ to = "/", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Code Golf home">
      <Prompt className="text-lg" />
      <span className="font-display text-lg leading-none tracking-wide">
        <span className="text-cream">CODE</span> <span className="text-green">GOLF</span>
      </span>
    </Link>
  );
}
