// src/routing/ProtectedRoute.jsx
// Protección de rutas en el navegador (solo UX): la seguridad real de los
// datos la imponen las reglas de Firestore (firestore.rules).
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading, role, isAdmin } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6">Cargando…</div>;

  // No logueado → login, recordando a dónde quería ir
  if (!user) return <Navigate to="/auth/login" replace state={{ from: loc }} />;

  // Admin entra a todo lo que permita "admin"
  if (isAdmin && allowedRoles.includes("admin")) return children;

  if (allowedRoles.length === 0 || allowedRoles.includes(role)) return children;

  return <Navigate to="/no-autorizado" replace />;
}
