import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import CourtDashboard from "./pages/CourtDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "lawyer") return "/lawyer";
  if (role === "judge") return "/court";
  return "/dashboard";
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={roleHome(user.role)} replace /> : <Register />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
