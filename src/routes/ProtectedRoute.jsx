import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );

  // 1. If no user is logged in at all -> Send to Login
  if (!user) return <Navigate to="/" replace />;

  const roleLower = role?.toLowerCase();
  const allowedLower = allowedRoles?.map(r => r.toLowerCase()) || [];

  // 2. If user is logged in but role is NOT allowed -> Send to safe fallback
  if (allowedLower.length > 0 && !allowedLower.includes(roleLower)) {
    
    // Safely route them based on their actual role so they don't hit the Auth login loop
    if (roleLower === "admin" || roleLower === "superadmin" || roleLower === "registrar") {
      return <Navigate to="/admin" replace />; 
    } else {
      return <Navigate to="/Enrollment" replace />; 
    }
  }

  return children;
};

export default ProtectedRoute;