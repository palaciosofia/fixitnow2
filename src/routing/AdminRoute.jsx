// src/routing/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function AdminRoute({ children }) {
  const { loading, isAdmin } = useAuth();
  if (loading) return null; // o un spinner
  return isAdmin ? children : <Navigate to="/" replace />;
}
