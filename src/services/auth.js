// src/services/auth.js
import { auth, db, googleProvider } from "../firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const ROLE_CACHE_KEY = "fixit_role";

// Asegura perfil si no existe (para logins normales / Google simple)
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
      // sin 'role' aquí
    });
  }
  return ref;
}

// ============================
//  REGISTRO CON EMAIL/CLAVE
// ============================
export async function registerUser({
  name,
  email,
  password,
  role,
  ciudad,
  barrio,
  telefono,
}) {
  const safeRole = role === "tecnico" ? "tecnico" : "cliente";

  // 1) Crear cuenta en Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // 2) Nombre visible en Auth
  try {
    if (name) await updateProfile(cred.user, { displayName: name });
  } catch {}

  // 3) Crear doc en users
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

  // 4) Si es técnico, crear doc en technicians
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
      await setDoc(doc(db, "technicians", cred.user.uid), techData, {
        merge: true,
      });
      console.log("Documento técnico creado:", cred.user.uid);
    } catch (e) {
      console.warn("No se pudo crear el documento técnico:", e?.message);
    }
  }

  return cred.user;
}


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


export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);

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

export async function registerWithGoogle({
  name,
  role,
  ciudad,
  barrio,
  telefono,
}) {
  const safeRole = role === "tecnico" ? "tecnico" : "cliente";

  const cred = await signInWithPopup(auth, googleProvider);
  const gUser = cred.user;

  const finalName = name || gUser.displayName || null;
  const finalEmail = (gUser.email || "").trim().toLowerCase();

  const userRef = doc(db, "users", gUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Crear el doc desde cero
    await setDoc(userRef, {
      uid: gUser.uid,
      name: finalName,
      email: finalEmail,
      role: safeRole,
      ciudad: ciudad ?? null,
      barrio: barrio ?? null,
      telefono: telefono ?? null,
      status: "activo",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Actualizar algunos campos (por si ya existía)
    await setDoc(
      userRef,
      {
        name: finalName,
        role: safeRole,
        ciudad: ciudad ?? null,
        barrio: barrio ?? null,
        telefono: telefono ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Si es técnico, crear/actualizar technicians
  if (safeRole === "tecnico") {
    const techData = {
      uid: gUser.uid,
      nombre: finalName || "",
      ciudad: ciudad ?? "",
      descripcion: "",
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
    await setDoc(doc(db, "technicians", gUser.uid), techData, { merge: true });
  }

  // Leer perfil para retornarlo
  let profile = null;
  try {
    const profileSnap = await getDoc(userRef);
    profile = profileSnap.exists() ? profileSnap.data() : null;
  } catch (e) {
    console.warn("No se pudo leer el perfil en Firestore:", e?.message);
  }

  return { user: gUser, profile };
}

// ============================
//  LOGOUT + RESET
// ============================
export async function logoutUser() {
  await signOut(auth);
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {}
}

export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}
