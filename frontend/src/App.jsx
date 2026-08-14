import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { StellarWalletProvider } from "./context/StellarWalletContext";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import CourtDashboard from "./pages/CourtDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import FeedbackPage from "./pages/FeedbackPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { trackPageView } from "./analytics";
import "./App.css";

function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "lawyer") return "/lawyer";
  if (role === "judge") return "/court";
  return "/dashboard";
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname, user?.role || null);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Register />} />
      {/* Public feedback page — accessible without login */}
      <Route path="/feedback" element={
        <FeedbackPage
          user={user}
          onClose={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
        />
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={["user"]}>
          <UserDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/lawyer" element={
        <ProtectedRoute allowedRoles={["lawyer"]}>
          <LawyerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/court" element={
        <ProtectedRoute allowedRoles={["judge"]}>
          <CourtDashboard />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={["admin", "judge"]}>
          <AnalyticsDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StellarWalletProvider>
        <AppRoutes />
      </StellarWalletProvider>
    </ThemeProvider>
  );
}
