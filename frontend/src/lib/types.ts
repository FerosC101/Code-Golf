// Mirrors backend/app/game/snapshot.py

export type RoomStatus = "lobby" | "active" | "results" | "finished";
export type Role = "host" | "player" | "spectator";

export type PublicTest = { input: string; expected_output: string };
export type HostTest = PublicTest & { hidden: boolean };

export type RoundInfo = {
  id: number;
  number: number;
  title: string;
  description: string;
  original_code: string;
  original_chars: number;
  duration_seconds: number;
  status: "pending" | "active" | "closed";
  starts_at: number | null;
  ends_at: number | null;
  public_tests: PublicTest[];
};

export type HostRound = RoundInfo & { tests: HostTest[] };

export type PlayerInfo = {
  id: number;
  name: string;
  points: number;
  connected: boolean;
  attempts: number;
  valid: boolean;
};

export type ResultEntry = {
  player_id: number;
  name: string;
  rank: number | null;
  points: number;
  chars: number | null;
  status: "valid" | "failed" | "none";
};

export type RoundResults = {
  round_number: number;
  title: string;
  original_chars: number;
  entries: ResultEntry[];
  shortest: { name: string; code: string; chars: number } | null;
};

export type LeaderboardEntry = {
  player_id: number;
  name: string;
  points: number;
  rank: number;
  movement: number | null;
};

export type HostSubmission = {
  id: number;
  player_id: number;
  name: string;
  chars: number;
  passed: boolean;
  code: string;
  submitted_at: number;
};

export type RoomState = {
  type: "state";
  server_now: number;
  role: Role;
  room: {
    code: string;
    name: string;
    status: RoomStatus;
    current_round: number;
    total_rounds: number;
    rounds_left: number;
    scoring: number[];
  };
  players: PlayerInfo[];
  round: RoundInfo | null;
  results: RoundResults | null;
  leaderboard: LeaderboardEntry[];
  me?: { player_id: number; name: string; points: number; best_chars: number | null; attempts: number } | null;
  host?: { rounds: HostRound[]; submissions: HostSubmission[]; best: Record<string, number> };
};

export type RoomEvent = { type: "event"; kind: string; text: string; at: number; player?: string; passed?: boolean };

export type TestStatus = "passed" | "failed" | "timeout" | "runtime_error";

export type JudgeResult = {
  chars: number;
  passed: boolean;
  failed: number;
  public: { index: number; status: TestStatus; stdout: string; error: string }[];
  hidden_total: number;
  hidden_passed: number;
  submitted?: boolean;
  previous_best?: number | null;
  best?: number | null;
  /** Practice only. */
  par?: number;
  par_solution?: string;
};

export type Difficulty = "easy" | "medium" | "hard" | "nightmare";

export type LibraryProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  original_chars: number;
  par: number;
};

export type PracticeProblem = LibraryProblem & {
  original_code: string;
  public_tests: PublicTest[];
  hidden_count: number;
};
