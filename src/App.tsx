
import {
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Invitation {
  project_id: number;
  role: "editor" | "reviewer" | "viewer";
  expires_at: string;
}

function InviteHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const token = params.get("token");
  const fromUser = params.get("from") || "Team Member";
  const projectId = params.get("projectId") || "";
  const projectName = params.get("projectName") || "";

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Preserve the existing project-join link flow.
  useEffect(() => {
    if (isLoading || token) return;

    const targetUrl = `/dashboard?inviteJoined=true&from=${encodeURIComponent(
      fromUser
    )}${
      projectId
        ? `&projectId=${encodeURIComponent(
            projectId
          )}&projectName=${encodeURIComponent(projectName)}`
        : ""
    }`;

    if (isAuthenticated) {
      navigate(targetUrl, { replace: true });
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`, {
        replace: true,
      });
    }
  }, [
    token,
    isAuthenticated,
    isLoading,
    navigate,
    fromUser,
    projectId,
    projectName,
  ]);

  // Preserve the token invitation when a recipient needs to log in.
  useEffect(() => {
    if (isLoading || token || isAuthenticated) return;

    // The existing-link effect above handles non-token invitations.
  }, [token, isAuthenticated, isLoading]);

  useEffect(() => {
    if (isLoading || !token || !isAuthenticated) return;

    const controller = new AbortController();

    async function loadInvitation() {
      setLoadingInvitation(true);
      setError("");

      try {
        const authToken = localStorage.getItem("cad_platform_token");

        const response = await fetch(
          `${API_URL}/projects/invitations/${encodeURIComponent(token!)}`,
          {
            signal: controller.signal,
            headers: authToken
              ? { Authorization: `Bearer ${authToken}` }
              : {},
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load this invitation."
          );
        }

        setInvitation(data.invitation);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this invitation."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingInvitation(false);
        }
      }
    }

    void loadInvitation();

    return () => controller.abort();
  }, [token, isAuthenticated, isLoading]);

  async function handleAcceptInvitation() {
    if (!token) return;

    const authToken = localStorage.getItem("cad_platform_token");

    if (!authToken) {
      navigate(
        `/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`,
        { replace: true }
      );
      return;
    }

    setAccepting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/projects/invitations/${encodeURIComponent(token)}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (
        response.status === 409 &&
        data.message === "You are already a member of this project"
      ) {
        setSuccess("You are already a member. Opening your dashboard...");
        window.setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1000);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to accept this invitation."
        );
      }

      setSuccess("Invitation accepted! Opening your dashboard...");
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to accept this invitation."
      );
    } finally {
      setAccepting(false);
    }
  }

  if (isLoading || (!token && !isAuthenticated)) {
    return (
      <div style={pageStyle}>
        <p>Preparing your project invitation...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={pageStyle}>
        <p>Opening your collaborative workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={pageStyle}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (loadingInvitation) {
    return (
      <div style={pageStyle}>
        <p>Loading invitation details...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1>Project Invitation</h1>

        {error && <p style={{ color: "#ff7777" }}>{error}</p>}
        {success && <p style={{ color: "#70e0a0" }}>{success}</p>}

        {invitation && !success && (
          <>
            <p>You have been invited to collaborate on a project.</p>
            <p>
              <strong>Project ID:</strong> {invitation.project_id}
            </p>
            <p>
              <strong>Your role:</strong>{" "}
              {invitation.role.charAt(0).toUpperCase() +
                invitation.role.slice(1)}
            </p>
            <p>
              <strong>Invitation expires:</strong>{" "}
              {new Date(invitation.expires_at).toLocaleString()}
            </p>
            <button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              style={buttonStyle}
            >
              {accepting ? "Accepting..." : "Accept Invitation"}
            </button>
          </>
        )}

        {!invitation && error && (
          <button
            onClick={() => navigate("/dashboard")}
            style={buttonStyle}
          >
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  alignItems: "center",
  justifyContent: "center",
  background: "#141414",
  color: "#fff",
  padding: "20px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "440px",
  padding: "32px",
  background: "#202020",
  borderRadius: "12px",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "20px",
  padding: "12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

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
