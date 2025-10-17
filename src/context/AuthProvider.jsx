// src/context/AuthProvider.jsx
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const ROLE_CACHE_KEY = "fixit_role"; // caché de UI (no seguridad real)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("invitado");
  const [profile, setProfile] = useState(null);     // perfil Firestore
  const [claims, setClaims] = useState({ admin: false }); // claims del token
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      // 🔹 Sin usuario: limpia todo
      if (!u) {
        setRole("invitado");
        setProfile(null);
        setClaims({ admin: false });
        unsubProfile && unsubProfile();
        try { localStorage.removeItem(ROLE_CACHE_KEY); } catch {}
        setLoading(false);
        return;
      }

      // 🔹 Prefill rápido desde caché para evitar parpadeo
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) setRole(cached);

      // 🔹 Refresca y lee claims (admin)
      try {
        const tokenRes = await getIdTokenResult(u, true);
        const isAdminClaim = tokenRes.claims?.admin === true;
        setClaims({ admin: isAdminClaim });
        if (isAdminClaim) {
          setRole("admin");
          try { localStorage.setItem(ROLE_CACHE_KEY, "admin"); } catch {}
        }
      } catch (err) {
        console.error("Error obteniendo claims:", err);
      }

      // 🔹 Suscripción al perfil (solo si NO es admin por claim)
      const ref = doc(db, "users", u.uid);
      unsubProfile = onSnapshot(
        ref,
        async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);

            // Si NO tiene claim de admin, el rol proviene del perfil
            if (!claims.admin) {
              const newRole = data.role || "cliente";
              setRole(newRole);
              try { localStorage.setItem(ROLE_CACHE_KEY, newRole); } catch {}
            }

            // (Opcional) Si un usuario está bloqueado, lo expulsas (no aplica a admin)
            if (data.blocked && !claims.admin) {
              try { await signOut(auth); } catch {}
            }
          } else {
            setProfile(null);
            if (!claims.admin) {
              setRole("cliente");
              try { localStorage.setItem(ROLE_CACHE_KEY, "cliente"); } catch {};
            }
          }
          setLoading(false);
        },
        // Fallback: lectura puntual si onSnapshot falla
        async () => {
          try {
            const s = await getDoc(ref);
            if (s.exists()) {
              const data = s.data();
              setProfile(data);
              if (!claims.admin) {
                const newRole = data.role || "cliente";
                setRole(newRole);
                try { localStorage.setItem(ROLE_CACHE_KEY, newRole); } catch {}
              }
            } else {
              setProfile(null);
              if (!claims.admin) {
                setRole("cliente");
                try { localStorage.setItem(ROLE_CACHE_KEY, "cliente"); } catch {}
              }
            }
          } finally {
            setLoading(false);
          }
        }
      );
    });

    return () => {
      unsubAuth && unsubAuth();
      unsubProfile && unsubProfile();
    };
  }, [/* intencionalmente vacío: el flujo de auth se vuelve a montar solo */]);

  // 🔸 Si llega/actualiza la claim admin después del snapshot, forzamos rol visible
  useEffect(() => {
    if (claims?.admin) {
      setRole("admin");
      try { localStorage.setItem(ROLE_CACHE_KEY, "admin"); } catch {}
    }
  }, [claims?.admin]);

  /* -------- Helpers para la UI -------- */
  const isCliente = role === "cliente";
  const isTecnico = role === "tecnico";
  const isAdmin   = role === "admin" || claims.admin === true;

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      claims,
      loading,
      isCliente,
      isTecnico,
      isAdmin,
    }),
    [user, role, profile, claims, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
