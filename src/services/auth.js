// src/services/auth.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const ROLE_CACHE_KEY = "fixit_role";

// Asegura perfil si no existe (NO escribe 'role' aquí para no romper reglas)
export async function ensureUserProfile(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName ?? extra.name ?? null,
      email: (user.email || extra.email || "").trim().toLowerCase() || null,
      ciudad: extra.ciudad ?? null,
      barrio: extra.barrio ?? null,
      telefono: extra.telefono ?? null,
      status: "activo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // ❗ sin 'role' aquí (las reglas permiten role solo en create cuando lo envías explícitamente)
    });
  }
  return ref;
}

// Registro con rol elegido: 'cliente' | 'tecnico'
export async function registerUser({ name, email, password, role, ciudad, barrio, telefono }) {
  // Sanitizar el rol
  const safeRole = role === "tecnico" ? "tecnico" : "cliente";

  // 1) Crear cuenta en Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // 2) Nombre visible en Firebase Auth
  try {
    if (name) await updateProfile(cred.user, { displayName: name });
  } catch {}

  // 3) Crear documento base en 'users'
  try {
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name: name ?? null,
      email: email.trim().toLowerCase(),
      role: safeRole,
      ciudad: ciudad ?? null,
      barrio: barrio ?? null,
      telefono: telefono ?? null,
      status: "activo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("No se pudo crear el perfil en Firestore:", e?.message);
  }

  // 4️⃣ Si es técnico, crear documento paralelo en 'technicians'
  if (safeRole === "tecnico") {
    try {
      const techData = {
        uid: cred.user.uid,
        nombre: name ?? "",
        descripcion: "",
        ciudad: ciudad ?? "",
        especialidades: [],
        aniosExperiencia: 0,
        tarifaBase: null,
        disponible: true,
        horarios: "",
        ratingPromedio: 0,
        publicado: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "technicians", cred.user.uid), techData, { merge: true });
      console.log("Documento técnico creado:", cred.user.uid);
    } catch (e) {
      console.warn("No se pudo crear el documento técnico:", e?.message);
    }
  }

  return cred.user;
}

// Login (lee perfil después)
export async function loginUser({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try {
    await ensureUserProfile(cred.user);
  } catch {}
  let profile = null;
  try {
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    profile = snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("No se pudo leer el perfil en Firestore:", e?.message);
  }
  return { user: cred.user, profile };
}

export async function logoutUser() {
  await signOut(auth);
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {}
}

export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}
