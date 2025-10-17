// src/AuthCheck/AuthCheck.jsx
import { useAuth } from "../context/AuthProvider";
export default function AuthCheck({ children }) {
  const { loading } = useAuth();
  if (loading) return null; // opcional: spinner
  return children;
}

