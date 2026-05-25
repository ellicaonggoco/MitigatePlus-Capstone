import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HazardManagement from "./pages/HazardManagement";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import GoBagItems from "./pages/GoBagItems";
import EvacuationCenters from "./pages/EvacuationCenters";
import ActivityLogs from "./pages/ActivityLogs";
import SuperAdmin from "./pages/SuperAdmin";
import About from "./pages/About";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen animated-bg">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/hazards"
              element={
                <PrivateRoute roles={["admin"]}>
                  <HazardManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <Reports />
                </PrivateRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <Users />
                </PrivateRoute>
              }
            />

            <Route
              path="/gobag"
              element={
                <PrivateRoute roles={["admin"]}>
                  <GoBagItems />
                </PrivateRoute>
              }
            />

            <Route
              path="/evacuation"
              element={
                <PrivateRoute roles={["admin"]}>
                  <EvacuationCenters />
                </PrivateRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <ActivityLogs />
                </PrivateRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <PrivateRoute roles={["superadmin"]}>
                  <SuperAdmin />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route path="/about" element={<About />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
