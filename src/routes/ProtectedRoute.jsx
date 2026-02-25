import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading)
    return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/Auth" replace />;

  const roleLower = role?.toLowerCase();
  const allowedLower = allowedRoles?.map(r => r.toLowerCase()) || [];

  // If user's role is not in allowedRoles → redirect
  if (allowedLower.length > 0 && !allowedLower.includes(roleLower)) {
    return <Navigate to="/Auth" replace />;
  }

  return children;
};

export default ProtectedRoute;