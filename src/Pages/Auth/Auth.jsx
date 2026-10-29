// src/Pages/Auth/Auth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function Auth() {
  const { pathname } = useLocation();
  // /auth sin subruta → inicio de sesión
  if (pathname.replace(/\/$/, "") === "/auth") return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}
