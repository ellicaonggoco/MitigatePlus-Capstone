import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-navy-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // 🚫 Barangay officials are NOT allowed on the web app – redirect to login
  if (user?.role === "barangay_official") {
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return children;
};

export default PrivateRoute;
