// Tokens live in localStorage so a refresh (or a laptop lid) doesn't kick you out.
// Every access is guarded: storage can throw in private windows.

export type PlayerSession = { token: string; name: string; id: number };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const session = {
  hostToken: (code: string) => read<string>(`cg:host:${code.toUpperCase()}`),
  setHostToken: (code: string, token: string) => write(`cg:host:${code.toUpperCase()}`, token),
  player: (code: string) => read<PlayerSession>(`cg:player:${code.toUpperCase()}`),
  setPlayer: (code: string, p: PlayerSession | null) => write(`cg:player:${code.toUpperCase()}`, p),
  lastName: () => read<string>("cg:name") ?? "",
  setLastName: (name: string) => write("cg:name", name),
  draft: (code: string, round: number) => read<string>(`cg:draft:${code.toUpperCase()}:${round}`),
  setDraft: (code: string, round: number, src: string) => write(`cg:draft:${code.toUpperCase()}:${round}`, src),
};
