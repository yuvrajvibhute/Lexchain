import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#05070d" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, border: "3px solid #1a2744", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                    <div style={{ color: "#6b7280", fontSize: 14, fontFamily: "monospace" }}>Loading...</div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard
        const home = user.role === "admin" ? "/admin" : user.role === "lawyer" ? "/lawyer" : user.role === "judge" ? "/court" : "/dashboard";
        return <Navigate to={home} replace />;
    }
    return children;
}
