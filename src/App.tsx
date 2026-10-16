import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function InviteHandler() {
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    const fromUser = params.get("from") || "Team Member";
    const projectId = params.get("projectId") || "";
    const projectName = params.get("projectName") || "";

    // Forward the project data
    const targetUrl = `/dashboard?inviteJoined=true&from=${encodeURIComponent(fromUser)}${
      projectId ? `&projectId=${projectId}&projectName=${encodeURIComponent(projectName)}` : ""
    }`;

    if (isAuthenticated) {
      navigate(targetUrl, { replace: true });
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, params]);

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#141414", color: "#fff" }}>
      <p>Joining collaborative workspace...</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/invite" element={<InviteHandler />} />

      <Route
        path="*"
        element={
          <div className="flex items-center justify-center h-screen bg-[#090d0f] text-white">
            <h1 className="text-2xl">404 - Page Not Found</h1>
          </div>
        }
      />
    </Routes>
  );
}

export default App;