import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { Mascot } from "../brand/Mascot";
import { Button } from "../components/Button";
import { Input } from "../components/Field";
import { api } from "../lib/api";
import { session } from "../lib/session";

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState(session.lastName());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const room = code.trim().toUpperCase();
    if (!room || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.join(room, name.trim());
      session.setPlayer(res.room_code, { token: res.player_token, name: res.name, id: res.player_id });
      session.setLastName(res.name);
      navigate(`/play/${res.room_code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-bg flex min-h-dvh flex-col">
      <header className="flex h-14 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="relative w-full max-w-sm animate-rise">
          <Mascot variant="head" className="absolute -top-14 right-3 w-20" />
          <form onSubmit={submit} className="relative rounded-md border border-slate bg-ink-2 shadow-[6px_6px_0_0_rgb(6_61_44/0.6)]">
            <div className="border-b border-slate px-5 py-3 font-mono text-[11px] text-fog">
              <span className="text-green">$</span> python join.py
            </div>
            <div className="space-y-5 px-5 pt-6 pb-6">
              <h1 className="font-display text-3xl text-cream">
                JOIN <span className="text-green">GAME</span>
              </h1>
              <Input
                label="Room code"
                name="room"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="7K4M2"
                className="text-center font-display !text-2xl tracking-[0.35em]"
                autoFocus={!code}
                required
              />
              <Input
                label="Your name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoComplete="nickname"
                placeholder="guido"
                autoFocus={!!code}
                required
              />
              {error && (
                <p className="font-mono text-xs text-danger" role="alert">
                  &gt; {error.toLowerCase()}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" busy={busy} disabled={!code || !name.trim()}>
                Join room
              </Button>
            </div>
          </form>
          <p className="mt-5 text-center font-mono text-xs text-fog">No account needed.</p>
          <p className="mt-2 text-center font-mono text-xs text-steel">
            <Link to="/host" className="hover:text-green">
              Host a game
            </Link>
            {code.length >= 4 && (
              <>
                {" · "}
                <Link to={`/watch/${code}`} className="hover:text-green">
                  Just watch
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
