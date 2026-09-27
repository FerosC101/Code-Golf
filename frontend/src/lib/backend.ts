// Where the game server lives. Empty = same origin (Vite dev proxy, or nginx in
// docker compose). Set VITE_BACKEND_URL when the frontend is hosted separately,
// e.g. on Vercel: VITE_BACKEND_URL=https://api.codegolf.example.com
const BASE = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}

export function wsUrl(path: string): string {
  const origin = BASE || `${location.protocol}//${location.host}`;
  return origin.replace(/^http/, "ws") + path;
}
