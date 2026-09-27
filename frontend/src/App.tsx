import { Route, Routes } from "react-router-dom";
import HostCreate from "./pages/HostCreate";
import HostDashboard from "./pages/HostDashboard";
import Join from "./pages/Join";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Play from "./pages/Play";
import Watch from "./pages/Watch";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Join />} />
      <Route path="/host" element={<HostCreate />} />
      <Route path="/host/:code" element={<HostDashboard />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/watch/:code" element={<Watch />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
