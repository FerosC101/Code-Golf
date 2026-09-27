import { memo, useMemo } from "react";
import { PALETTE } from "./pixelArt";

type Props = {
  rows: string[];
  /** Palette overrides. "#" defaults to currentColor so icons inherit text colour. */
  palette?: Record<string, string>;
  className?: string;
  title?: string;
};

/** Renders a character grid as crisp SVG rects, merging horizontal runs. */
export const Pixels = memo(function Pixels({ rows, palette, className, title }: Props) {
  const { rects, width, height } = useMemo(() => {
    const pal: Record<string, string> = { "#": "currentColor", ...PALETTE, ...palette };
    const out: { x: number; y: number; w: number; fill: string }[] = [];
    const width = Math.max(...rows.map((r) => r.length));
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        if (ch === "." || ch === " " || !pal[ch]) {
          x++;
          continue;
        }
        const start = x;
        while (x < row.length && row[x] === ch) x++;
        out.push({ x: start, y, w: x - start, fill: pal[ch] });
      }
    });
    return { rects: out, width, height: rows.length };
  }, [rows, palette]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
});
