// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null };
  }
  return context;
};
