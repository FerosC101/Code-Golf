import { useCallback, useEffect, useRef, useState } from "react";
import { wsUrl } from "./backend";
import type { RoomEvent, RoomState } from "./types";

export type Connection = "connecting" | "open" | "reconnecting" | "closed";

type Options = { token?: string | null; onEvent?: (e: RoomEvent) => void };

/**
 * Live room state over a WebSocket.
 *
 * The server clock is authoritative. We estimate the offset from ping/pong
 * round trips (keeping the lowest-latency sample) so every client renders the
 * same countdown, whatever its local clock says.
 */
export function useRoom(code: string, { token, onEvent }: Options = {}) {
  const [state, setState] = useState<RoomState | null>(null);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [fatal, setFatal] = useState<string | null>(null);
  const offset = useRef(0);
  const bestRtt = useRef(Infinity);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let stopped = false;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;

    const connect = () => {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      ws = new WebSocket(wsUrl(`/ws/rooms/${encodeURIComponent(code)}${qs}`));

      const ping = () => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "ping", t: Date.now() }));

      ws.onopen = () => {
        retry = 0;
        bestRtt.current = Infinity;
        setConnection("open");
        ping();
        window.clearInterval(pingTimer);
        pingTimer = window.setInterval(ping, 8000);
        window.setTimeout(ping, 600);
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === "state") {
          // Before the first pong lands, a rough offset beats none.
          if (bestRtt.current === Infinity) offset.current = data.server_now - Date.now();
          setState(data);
        } else if (data.type === "pong") {
          const now = Date.now();
          const rtt = now - data.t;
          if (rtt <= bestRtt.current) {
            bestRtt.current = rtt;
            offset.current = data.server_now + rtt / 2 - now;
          }
        } else if (data.type === "event") {
          setEvents((prev) => [...prev.slice(-40), data]);
          onEventRef.current?.(data);
        } else if (data.type === "kicked" || data.type === "error") {
          stopped = true;
          setFatal(data.text);
        }
      };
      ws.onclose = (ev) => {
        window.clearInterval(pingTimer);
        if (stopped || ev.code === 4403 || ev.code === 4404) {
          setConnection("closed");
          return;
        }
        setConnection("reconnecting");
        retry = Math.min(retry + 1, 6);
        retryTimer = window.setTimeout(connect, 300 * 2 ** retry);
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearInterval(pingTimer);
      window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, [code, token]);

  const serverNow = useCallback(() => Date.now() + offset.current, []);
  return { state, events, connection, fatal, serverNow };
}

/** Re-renders every `interval` ms with the synced server time. */
export function useServerNow(serverNow: () => number, interval = 200) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = window.setInterval(() => setNow(serverNow()), interval);
    return () => window.clearInterval(id);
  }, [serverNow, interval]);
  return now;
}
