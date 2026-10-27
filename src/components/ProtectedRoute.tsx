import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait until the existing login session is checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#090d0f] text-white">
        <p>Loading your workspace...</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Allow authenticated users to access the dashboard
  return <Outlet />;
}

export default ProtectedRoute;