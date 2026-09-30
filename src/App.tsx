import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    // Notice: <Router> is removed here because it's already in main.tsx!
    <Routes>
      {/* Landing Page (Home) */}
      <Route path="/" element={<LandingPage />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Register page */}
      <Route path="/register" element={<Register />} />
      
      {/* Dashboard page */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* 404 Route - Must be at the very bottom! */}
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