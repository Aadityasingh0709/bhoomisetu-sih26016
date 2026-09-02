import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

// Gate a route behind login, and optionally restrict it to specific roles.
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/projects" replace />;

  return <Outlet />;
}
