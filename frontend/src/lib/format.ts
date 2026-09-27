export function countChars(code: string): number {
  // Must match backend count_chars(): CRLF → LF, then count code points.
  return [...code.replace(/\r\n?/g, "\n")].length;
}

export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const QUIPS = [
  "Your professor would hate this.",
  "PEP 8 has left the chat.",
  "Readability is a suggestion.",
  "Python crimes detected.",
  "Less code. More chaos.",
  "Guido is watching.",
  "Whitespace is a luxury.",
];
export const quip = (seed: number) => QUIPS[Math.abs(seed) % QUIPS.length];
