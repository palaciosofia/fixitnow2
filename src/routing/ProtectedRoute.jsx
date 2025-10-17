import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// normaliza: lower, quita espacios y acentos
function norm(s) {
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
function firstNonEmpty(...vals) {
  for (const v of vals) if (v != null && v !== "") return v;
  return null;
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading, profile, claims } = useAuth();
  const loc = useLocation();

  const [resolvedRole, setResolvedRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setResolvedRole(null);
      setRoleLoading(false);
      return;
    }

    // 1) Contexto (rápido)
    const fromCtx = firstNonEmpty(
      profile?.role,
      profile?.rol,
      profile?.tipo,
      claims?.role
    );
    if (fromCtx) {
      setResolvedRole(fromCtx);
      setRoleLoading(false);
      console.log("[PR] role from context:", fromCtx);
      return;
    }

    // 2) Firestore: /users/{uid} y si no /usuarios/{uid}
    (async () => {
      setRoleLoading(true);
      let role = null;
      try {
        let snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          // intenta en /usuarios
          snap = await getDoc(doc(db, "usuarios", user.uid));
        }
        if (snap.exists()) {
          const d = snap.data();
          role = firstNonEmpty(d?.role, d?.rol, d?.tipo, d?.userType);
        }
      } catch (e) {
        console.warn("[PR] error leyendo rol:", e?.message || e);
      } finally {
        setResolvedRole(role);
        setRoleLoading(false);
        console.log("[PR] role from db:", role);
      }
    })();
  }, [user, profile?.role, profile?.rol, claims?.role]);

  // cargando auth o rol
  if (loading || roleLoading) return <div className="p-6">Cargando…</div>;

  // no logueado
  if (!user) return <Navigate to="/auth/login" replace state={{ from: loc }} />;

  // normalización
  const allowed = allowedRoles.map(norm);
  const role = norm(resolvedRole);
  const isAdmin = !!claims?.admin || role === "admin";

  // admin
  if (isAdmin && allowed.includes("admin")) return children;

  // si resolvió rol y está permitido
  if (role && (allowed.length === 0 || allowed.includes(role))) return children;

  // ⚠️ Fallback amable: si no se pudo resolver rol pero está logueado,
  // y la ruta permite cliente/tecnico, dejamos pasar.
  if (!role && (allowed.includes("cliente") || allowed.includes("tecnico"))) {
    console.log("[PR] fallback allow (no role resolved, user signed-in).");
    return children;
  }

  // bloqueo
  return <Navigate to="/no-autorizado" replace />;
}
