import { Link } from "react-router-dom";
import { Mascot } from "../brand/Mascot";

export default function NotFound() {
  return (
    <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <Mascot variant="head" className="w-24" idle />
      <h1 className="font-display text-4xl text-cream">
        404 <span className="text-green">OUT OF BOUNDS</span>
      </h1>
      <p className="font-mono text-sm text-fog">&gt; NameError: name &apos;this_page&apos; is not defined</p>
      <Link to="/" className="font-mono text-sm text-green hover:underline">
        back to the tee →
      </Link>
    </div>
  );
}
