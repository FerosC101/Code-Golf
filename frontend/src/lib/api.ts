import { apiUrl } from "./backend";
import type { JudgeResult, LibraryProblem, PracticeProblem } from "./types";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { host?: string; player?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.host) headers["X-Host-Token"] = init.host;
  if (init.player) headers["X-Player-Token"] = init.player;
  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError("Can't reach the server.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg : "Something broke.";
    throw new ApiError(message ?? "Something broke.", res.status);
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export type RoundPayload = {
  title: string;
  description: string;
  original_code: string;
  duration_seconds: number;
  tests: { input: string; expected_output: string; hidden: boolean }[];
};

export const api = {
  createRoom: (name: string, scoring?: number[]) =>
    request<{ room_code: string; host_token: string; name: string }>("/api/rooms", {
      method: "POST",
      body: json({ name, scoring }),
    }),
  roomInfo: (code: string) =>
    request<{ room_code: string; name: string; status: string; players: number }>(`/api/rooms/${code}`),
  join: (code: string, name: string) =>
    request<{ room_code: string; player_id: number; player_token: string; name: string }>(
      `/api/rooms/${code}/join`,
      { method: "POST", body: json({ name }) },
    ),

  // host
  updateRoom: (code: string, host: string, data: { name?: string; scoring?: number[] }) =>
    request(`/api/rooms/${code}`, { method: "PATCH", host, body: json(data) }),
  addRound: (code: string, host: string, data: RoundPayload) =>
    request<{ id: number }>(`/api/rooms/${code}/rounds`, { method: "POST", host, body: json(data) }),
  addLibraryRounds: (code: string, host: string, slugs: string[]) =>
    request<{ added: number }>(`/api/rooms/${code}/rounds/library`, { method: "POST", host, body: json({ slugs }) }),
  addSamplePack: (code: string, host: string) =>
    request(`/api/rooms/${code}/rounds/sample-pack`, { method: "POST", host }),
  updateRound: (code: string, host: string, id: number, data: RoundPayload) =>
    request(`/api/rooms/${code}/rounds/${id}`, { method: "PUT", host, body: json(data) }),
  deleteRound: (code: string, host: string, id: number) =>
    request(`/api/rooms/${code}/rounds/${id}`, { method: "DELETE", host }),
  verifyRound: (code: string, host: string, id: number) =>
    request<{ passed: boolean; results: { status: string; stdout: string; error: string }[] }>(
      `/api/rooms/${code}/rounds/${id}/verify`,
      { method: "POST", host },
    ),
  kick: (code: string, host: string, playerId: number) =>
    request(`/api/rooms/${code}/players/${playerId}`, { method: "DELETE", host }),
  start: (code: string, host: string) => request(`/api/rooms/${code}/start`, { method: "POST", host }),
  end: (code: string, host: string) => request(`/api/rooms/${code}/end`, { method: "POST", host }),
  finish: (code: string, host: string) => request(`/api/rooms/${code}/finish`, { method: "POST", host }),

  // practice + problem library
  library: () => request<{ problems: LibraryProblem[] }>("/api/practice").then((r) => r.problems),
  practiceProblem: (slug: string) => request<PracticeProblem>(`/api/practice/${encodeURIComponent(slug)}`),
  practice: (slug: string, kind: "run" | "submit", source: string) =>
    request<JudgeResult>(`/api/practice/${encodeURIComponent(slug)}/${kind}`, { method: "POST", body: json({ code: source }) }),

  // player
  run: (code: string, player: string, source: string) =>
    request<JudgeResult>(`/api/rooms/${code}/run`, { method: "POST", player, body: json({ code: source }) }),
  submit: (code: string, player: string, source: string) =>
    request<JudgeResult>(`/api/rooms/${code}/submit`, { method: "POST", player, body: json({ code: source }) }),
};
