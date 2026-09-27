import { useEffect, useState } from "react";
import { api } from "./api";
import type { LibraryProblem } from "./types";

// The library is static per deploy: fetch once per page load and share it.
let cache: Promise<LibraryProblem[]> | null = null;

export function useLibrary() {
  const [problems, setProblems] = useState<LibraryProblem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    cache ??= api.library().catch((err) => {
      cache = null;
      throw err;
    });
    let alive = true;
    cache.then(
      (p) => alive && setProblems(p),
      (err: Error) => alive && setError(err.message),
    );
    return () => {
      alive = false;
    };
  }, []);
  return { problems, error };
}
