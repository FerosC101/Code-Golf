import { MASCOT_HEAD, MASCOT_SCENE } from "./pixelArt";
import { Pixels } from "./Pixels";

type Props = {
  variant?: "scene" | "head";
  className?: string;
  /** Gentle idle bob. Off for static placements. */
  idle?: boolean;
};

/** The Code Golf snake. Use sparingly: landing, lobby, empty states, winners. */
export function Mascot({ variant = "scene", className = "", idle = false }: Props) {
  return (
    <div className={`${idle ? "animate-float" : ""} ${className}`}>
      <Pixels
        rows={variant === "head" ? MASCOT_HEAD : MASCOT_SCENE}
        className="block h-auto w-full"
        title="Code Golf snake wearing sunglasses"
      />
    </div>
  );
}
