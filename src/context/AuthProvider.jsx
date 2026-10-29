// src/context/AuthProvider.jsx
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const AuthCtx = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthCtx);

const ROLE_CACHE_KEY = "fixit_role"; // caché solo para la UI (la seguridad real está en las reglas)

function readCachedRole() {
  try {
    return localStorage.getItem(ROLE_CACHE_KEY);
  } catch {
    return null;
  }
}
function writeCachedRole(role) {
  try {
    if (role) localStorage.setItem(ROLE_CACHE_KEY, role);
    else localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    /* almacenamiento no disponible (modo privado, etc.) */
  }
}

/** "Técnico " → "tecnico" (minúsculas, sin tildes ni espacios) */
function normalizeRole(r) {
  if (!r) return null;
  return String(r).trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") || null;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // documento /users/{uid}
  const [claims, setClaims] = useState({ admin: false }); // custom claims del token
  const [loading, setLoading] = useState(true);
  const [cachedRole, setCachedRole] = useState(null);

  useEffect(() => {
    let unsubProfile = null;
    let currentUid = null;

    const stopProfile = () => {
      if (unsubProfile) unsubProfile();
      unsubProfile = null;
    };

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      stopProfile();
      currentUid = u?.uid ?? null;
      setUser(u);

      // Sin usuario: limpia todo
      if (!u) {
        setProfile(null);
        setClaims({ admin: false });
        setCachedRole(null);
        writeCachedRole(null);
        setLoading(false);
        return;
      }

      // Hasta tener claims y perfil del nuevo usuario, el rol aún no es definitivo
      setLoading(true);
      setProfile(null);

      // Prefill rápido desde caché para evitar parpadeo en la UI
      setCachedRole(readCachedRole());

      // Claims (admin) — se leen antes de escuchar el perfil
      let isAdminClaim = false;
      try {
        const tokenRes = await getIdTokenResult(u, true);
        isAdminClaim = tokenRes.claims?.admin === true;
      } catch (err) {
        console.error("Error obteniendo claims:", err);
      }
      if (currentUid !== u.uid) return; // cambió el usuario mientras esperábamos
      setClaims({ admin: isAdminClaim });

      // Perfil en tiempo real
      unsubProfile = onSnapshot(
        doc(db, "users", u.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : null;
          setProfile(data);

          // Un usuario bloqueado por el admin es expulsado (no aplica a admins)
          if (!isAdminClaim && (data?.blocked === true || data?.bloqueado === true)) {
            signOut(auth).catch(() => {});
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error leyendo el perfil:", err);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      stopProfile();
    };
  }, []);

  // Rol efectivo: claim admin > rol del perfil > caché > cliente
  const profileRole = normalizeRole(profile?.role ?? profile?.rol ?? profile?.tipo);
  const role = useMemo(() => {
    if (!user) return "invitado";
    if (claims.admin) return "admin";
    if (profileRole) return profileRole;
    if (loading && cachedRole) return cachedRole;
    return "cliente";
  }, [user, claims.admin, profileRole, loading, cachedRole]);

  useEffect(() => {
    if (user && !loading) writeCachedRole(role);
  }, [user, loading, role]);

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      claims,
      loading,
      isCliente: role === "cliente",
      isTecnico: role === "tecnico",
      isAdmin: role === "admin",
    }),
    [user, role, profile, claims, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
