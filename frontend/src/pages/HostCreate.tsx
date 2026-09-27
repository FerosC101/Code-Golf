import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { Mascot } from "../brand/Mascot";
import { Button } from "../components/Button";
import { Input } from "../components/Field";
import { api } from "../lib/api";
import { session } from "../lib/session";

export default function HostCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("Game Night");
  const [samples, setSamples] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const room = await api.createRoom(name.trim() || "Game Night");
      session.setHostToken(room.room_code, room.host_token);
      if (samples) await api.addSamplePack(room.room_code, room.host_token);
      navigate(`/host/${room.room_code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid-bg flex min-h-dvh flex-col">
      <header className="flex h-14 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="grid w-full max-w-3xl items-center gap-10 md:grid-cols-[1fr_1fr]">
          <form onSubmit={create} className="animate-rise rounded-md border border-slate bg-ink-2 shadow-[6px_6px_0_0_rgb(6_61_44/0.6)]">
            <div className="border-b border-slate px-5 py-3 font-mono text-[11px] text-fog">
              <span className="text-green">$</span> python host.py --new
            </div>
            <div className="space-y-5 p-5">
              <h1 className="font-display text-3xl text-cream">
                HOST A <span className="text-green">GAME</span>
              </h1>
              <Input label="Room name" name="room-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              <label className="flex cursor-pointer items-start gap-3 font-mono text-xs text-fog">
                <input
                  type="checkbox"
                  checked={samples}
                  onChange={(e) => setSamples(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-green)]"
                />
                <span>
                  Load the starter pack
                  <span className="block text-steel">5 classic problems with hidden tests. edit or delete any of them.</span>
                </span>
              </label>
              {error && <p className="font-mono text-xs text-danger">&gt; {error.toLowerCase()}</p>}
              <Button type="submit" size="lg" className="w-full" busy={busy}>
                Create room
              </Button>
            </div>
          </form>
          <div className="hidden animate-rise text-center [animation-delay:150ms] md:block">
            <Mascot className="mx-auto w-full max-w-xs" idle />
            <p className="mt-4 font-mono text-xs text-fog">
              you get a 5-character room code.
              <br />
              players join with a name. no accounts.
            </p>
          </div>
        </div>
      </main>
      <p className="pb-6 text-center font-mono text-xs text-steel">
        <Link to="/join" className="hover:text-green">
          joining instead?
        </Link>
      </p>
    </div>
  );
}
