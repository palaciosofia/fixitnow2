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

import { DEFAULT_HORARIOS, buildSlug } from "./technicians";

export const ROLE_CACHE_KEY = "fixit_role";

/** true si el perfil está bloqueado por un admin (acepta el campo antiguo `bloqueado`). */
export function isBlockedProfile(profile) {
  return profile?.blocked === true || profile?.bloqueado === true;
}

/** Si la cuenta está bloqueada, cierra la sesión y lanza un error legible. */
async function rejectIfBlocked(profile) {
  if (isBlockedProfile(profile)) {
    await signOut(auth);
    throw new Error("Tu cuenta está bloqueada. Contacta al administrador.");
  }
}

/** Datos iniciales del documento /technicians/{uid} */
function newTechnicianDoc(uid, nombre, ciudad) {
  return {
    uid,
    nombre: nombre || "",
    slug: buildSlug(nombre || "tecnico", uid),
    descripcion: "",
    bioCorta: "",
    ciudad: ciudad || "",
    especialidades: [],
    servicios: [],
    zonasCobertura: [],
    aniosExperiencia: 0,
    tarifaBase: null,
    disponible: true,
    horarios: { ...DEFAULT_HORARIOS },
    excepciones: {},
    ratingPromedio: 0,
    reseñasCount: 0,
    publicado: false,
    telefono: "",
    certificaciones: [],
    disponibilidadTxt: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Crea el documento del técnico solo si todavía no existe (nunca sobrescribe un perfil). */
async function ensureTechnicianDoc(uid, nombre, ciudad) {
  const ref = doc(db, "technicians", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, newTechnicianDoc(uid, nombre, ciudad));
}

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
  } catch (e) {
    console.warn("No se pudo guardar el nombre visible:", e?.message);
  }

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
      await ensureTechnicianDoc(cred.user.uid, name, ciudad);
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
  } catch (e) {
    console.warn("No se pudo asegurar el perfil:", e?.message);
  }

  let profile = null;
  try {
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    profile = snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("No se pudo leer el perfil en Firestore:", e?.message);
  }
  await rejectIfBlocked(profile);
  return { user: cred.user, profile };
}


export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);

  try {
    await ensureUserProfile(cred.user);
  } catch (e) {
    console.warn("No se pudo asegurar el perfil:", e?.message);
  }

  let profile = null;
  try {
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    profile = snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("No se pudo leer el perfil en Firestore:", e?.message);
  }

  await rejectIfBlocked(profile);
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
  // Usuario sin rol todavía (p. ej. entró antes con "Iniciar con Google"): puede elegirlo ahora
  const assignRole = !snap.exists() || !snap.data()?.role;

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
    // El usuario ya existía: NO se cambia un rol ya asignado (evita que un
    // técnico/admin quede convertido en cliente). Solo se completan datos que falten.
    const current = snap.data();
    const patch = { updatedAt: serverTimestamp() };
    if (assignRole) patch.role = safeRole;
    if (!current.name && finalName) patch.name = finalName;
    if (!current.ciudad && ciudad) patch.ciudad = ciudad;
    if (!current.barrio && barrio) patch.barrio = barrio;
    if (!current.telefono && telefono) patch.telefono = telefono;
    await setDoc(userRef, patch, { merge: true });
  }

  // Si se registra como técnico (y no tenía rol), crear su perfil técnico
  if (safeRole === "tecnico" && assignRole) {
    await ensureTechnicianDoc(gUser.uid, finalName, ciudad);
  }

  // Leer perfil para retornarlo
  let profile = null;
  try {
    const profileSnap = await getDoc(userRef);
    profile = profileSnap.exists() ? profileSnap.data() : null;
  } catch (e) {
    console.warn("No se pudo leer el perfil en Firestore:", e?.message);
  }

  await rejectIfBlocked(profile);
  return { user: gUser, profile };
}

// ============================
//  LOGOUT + RESET
// ============================
export async function logoutUser() {
  await signOut(auth);
  try {
    localStorage.removeItem(ROLE_CACHE_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}
