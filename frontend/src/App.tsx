import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import { invitationsApi } from "./services/api";
import "./App.css";

function InviteHandler() {
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking invitation link...");

  useEffect(() => {
    if (isLoading) return;
    const token = params.get("token");
    if (!token) {
      setMessage("This invitation link is missing its token. Ask the project owner to generate a new link.");
      return;
    }

    let cancelled = false;
    const processInvitation = async () => {
      try {
        // Validate before redirecting so expired or malformed links are explained.
        await invitationsApi.validate(token);
        if (cancelled) return;
        if (!isAuthenticated) {
          const redirect = `/invite?token=${encodeURIComponent(token)}`;
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
          return;
        }

        setMessage("Accepting invitation...");
        const accepted = await invitationsApi.accept(token);
        if (cancelled) return;
        navigate(`/dashboard?inviteJoined=true&projectId=${encodeURIComponent(String(accepted.project_id))}`, { replace: true });
      } catch (error: any) {
        if (cancelled) return;
        setMessage(error?.message || "This invitation is invalid, expired, or has already been used.");
      }
    };

    void processInvitation();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, navigate, params]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", padding: 24, flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center", background: "#141414", color: "#fff", textAlign: "center" }}>
      <p>{message}</p>
      {message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired") || message.toLowerCase().includes("missing") ? (
        <button onClick={() => navigate("/login")} style={{ padding: "10px 16px", cursor: "pointer" }}>Go to login</button>
      ) : null}
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