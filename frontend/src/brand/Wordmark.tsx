import { Pixels } from "./Pixels";

// 7×8 block glyphs, two-pixel strokes. Hand-drawn to match the arcade logo.
const GLYPHS: Record<string, string[]> = {
  C: [".######", "#######", "##.....", "##.....", "##.....", "##.....", "#######", ".######"],
  O: [".#####.", "#######", "##...##", "##...##", "##...##", "##...##", "#######", ".#####."],
  D: ["######.", "#######", "##...##", "##...##", "##...##", "##...##", "#######", "######."],
  E: ["#######", "#######", "##.....", "######.", "######.", "##.....", "#######", "#######"],
  G: [".######", "#######", "##.....", "##.####", "##.####", "##...##", "#######", ".######"],
  L: ["##.....", "##.....", "##.....", "##.....", "##.....", "##.....", "#######", "#######"],
  F: ["#######", "#######", "##.....", "######.", "######.", "##.....", "##.....", "##....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

function word(text: string, ink: string): string[] {
  const rows = Array.from({ length: 8 }, () => "");
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    for (let y = 0; y < 8; y++) rows[y] += (i ? "." : "") + g[y].replace(/#/g, ink);
  });
  return rows;
}

/** Stamp `src` onto `dst` at (x, y) behind existing pixels; "." in src is transparent. */
function stamp(dst: string[], src: string[], x: number, y: number): string[] {
  const out = [...dst];
  src.forEach((row, dy) => {
    const line = (out[y + dy] ?? "").padEnd(x + row.length, ".").split("");
    [...row].forEach((ch, dx) => {
      if (ch !== "." && (line[x + dx] ?? ".") === ".") line[x + dx] = ch;
    });
    out[y + dy] = line.join("");
  });
  return out;
}

// A golf flag planted in the "O" of GOLF: cream pole, green pennant.
const FLAG = ["wFFF", "wFFFF", "wFF.", "w...", "w...", "w...", "w...", "w...", "w...", "w..."];

const PAL = { c: "var(--color-cream)", g: "var(--color-green)", w: "var(--color-cream)", F: "var(--color-green)" };

function buildStacked(): string[] {
  const code = word("CODE", "c");
  const golf = word("GOLF", "g");
  const blank = ".".repeat(code[0].length);
  let rows = [...code, blank, blank, blank, blank, ...golf];
  // O of GOLF spans x=8..14 with its hole at x=10..12. The pole drops through
  // the gap, disappears behind the O's top stroke and stands in the "cup".
  rows = stamp(rows, FLAG, 11, 8);
  return rows;
}

function buildInline(): string[] {
  const code = word("CODE", "c");
  const golf = word("GOLF", "g");
  return code.map((row, y) => `${row}.....${golf[y]}`);
}

const STACKED = buildStacked();
const INLINE = buildInline();

type Props = { layout?: "stacked" | "inline"; className?: string };

export function Wordmark({ layout = "stacked", className = "" }: Props) {
  return (
    <Pixels
      rows={layout === "stacked" ? STACKED : INLINE}
      palette={PAL}
      className={className}
      title="Code Golf"
    />
  );
}
