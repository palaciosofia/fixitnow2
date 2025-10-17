// src/services/technicians.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot, // (opcional) para catálogo en vivo
} from "firebase/firestore";
import { db } from "../firebase";

const TECHS = "technicians";

/* ----------------------- utils ----------------------- */
function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function buildSlug(nombre, uid) {
  const base = slugify(nombre || "tecnico");
  const suffix = (uid || "").slice(0, 6) || Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/* ------------- lecturas/escrituras básicas ------------ */

/** Lee el doc del técnico (por uid = id del doc) */
export async function getMyTechnicianDoc(uid) {
  const ref = doc(db, TECHS, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Lee un técnico por ID de documento (para /agendar/:id) */
export async function getTechById(id) {
  if (!id) return null;
  const ref = doc(db, TECHS, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Crea el doc si no existe (id === uid) con valores por defecto + patch opcional */
export async function ensureMyTechnicianDoc(uid, patch = {}) {
  const ref = doc(db, TECHS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const nombre = patch.nombre ?? "";
    const data = {
      uid,
      nombre,
      slug: buildSlug(nombre, uid), // ✅ slug inicial
      descripcion: "",
      bioCorta: "",
      ciudad: patch.ciudad ?? "",
      especialidades: [],
      servicios: [], // [{ nombre, precioSugerido }]
      zonasCobertura: [],
      aniosExperiencia: 0,
      tarifaBase: null,
      disponible: true,

      // ✅ Horarios por día (para generar slots de 1h) y excepciones por fecha
      horarios: {
        lun: [{ inicio: "08:00", fin: "18:00" }],
        mar: [{ inicio: "08:00", fin: "18:00" }],
        mie: [{ inicio: "08:00", fin: "18:00" }],
        jue: [{ inicio: "08:00", fin: "18:00" }],
        vie: [{ inicio: "08:00", fin: "18:00" }],
        sab: [],
        dom: [],
      },
      excepciones: {}, // ej: { "2025-10-23": ["12:00","13:00"] }

      ratingPromedio: 0,
      reseñasCount: 0,
      publicado: false,

      // ✅ Extras útiles en el perfil
      telefono: "",
      certificaciones: [],
      disponibilidadTxt: "",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data, { merge: true });
    return { id: uid, ...data };
  }
  return { id: snap.id, ...snap.data() };
}

/** Guarda (merge) campos del doc del técnico. Si cambia el nombre, actualiza slug. */
export async function saveMyTechnicianDoc(uid, patch = {}) {
  const ref = doc(db, TECHS, uid);

  // Si viene un nombre nuevo, generamos/actualizamos slug
  const extra = {};
  if (typeof patch.nombre === "string") {
    extra.slug = buildSlug(patch.nombre, uid);
  }

  await setDoc(
    ref,
    { ...patch, ...extra, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Cambia el flag publicado (aplica tus reglas validPublish()) */
export async function setPublicado(uid, publicado = true) {
  const ref = doc(db, TECHS, uid);
  await updateDoc(ref, {
    publicado: !!publicado,
    updatedAt: serverTimestamp(),
  });
}

/* ---------------------- catálogo ---------------------- */

/**
 * Obtiene una página de técnicos publicados con filtros simples.
 * - Filtros server-side: especialidad, ciudad, disponible
 * - Orden: "rating" (desc), "precio_asc", "precio_desc"
 * - Paginación con cursor serializable (no snapshot) y tie-breaker por "nombre" para orden estable.
 *
 * @param {Object} opts
 * @param {string|null} [opts.especialidad]
 * @param {string|null} [opts.ciudad]
 * @param {"rating"|"precio_asc"|"precio_desc"} [opts.orden="rating"]
 * @param {boolean} [opts.disponibleSolo=false]
 * @param {number} [opts.pageSize=12]
 * @param {{ primary:any, tie:string, orden:string }|null} [opts.cursor]
 * @returns {Promise<{ items: any[], cursor: { primary:any, tie:string, orden:string } | null }>}
 */
export async function fetchTechniciansPage({
  especialidad = null,
  ciudad = null,
  orden = "rating",
  disponibleSolo = false,
  pageSize = 12,
  cursor = null,
} = {}) {
  const col = collection(db, TECHS);

  const clauses = [where("publicado", "==", true)];
  if (especialidad) clauses.push(where("especialidades", "array-contains", especialidad));
  if (ciudad) clauses.push(where("ciudad", "==", ciudad));
  if (disponibleSolo) clauses.push(where("disponible", "==", true));

  // Campo principal y dirección
  let primaryField = "ratingPromedio";
  let primaryDir = "desc";
  if (orden === "precio_asc") { primaryField = "tarifaBase"; primaryDir = "asc"; }
  if (orden === "precio_desc") { primaryField = "tarifaBase"; primaryDir = "desc"; }

  // Empate estable
  const orderA = orderBy(primaryField, primaryDir);
  const orderB = orderBy("nombre", "asc");

  // Query base
  let qy = query(col, ...clauses, orderA, orderB, limit(pageSize));

  // Paginación con valores (cursor serializable)
  if (cursor && cursor.orden === orden) {
    const { primary, tie } = cursor;
    qy = query(col, ...clauses, orderA, orderB, startAfter(primary ?? null, tie ?? ""), limit(pageSize));
  }

  const snap = await getDocs(qy);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Próximo cursor (toma los mismos campos por los que ordenamos)
  const last = snap.docs[snap.docs.length - 1] || null;
  const nextCursor = last
    ? {
        primary: last.get(primaryField) ?? null,
        tie: last.get("nombre") ?? "",
        orden,
      }
    : null;

  return { items, cursor: nextCursor };
}

/* ---------------- perfil público por slug -------------- */

/**
 * Busca un técnico por slug (solo si está publicado).
 * Devuelve null si no existe o no está publicado.
 */
export async function getTechBySlug(slug) {
  if (!slug) return null;
  const col = collection(db, TECHS);
  const qy = query(col, where("slug", "==", slug), where("publicado", "==", true), limit(1));
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/* --------------- (opcional) catálogo en vivo ---------- */

/**
 * Suscripción en vivo a técnicos publicados con filtros básicos.
 * Útil si algún día quieres que el catálogo se actualice en tiempo real.
 *
 * @param {{ especialidad?:string|null, ciudad?:string|null, orden?:"rating"|"precio_asc"|"precio_desc", disponibleSolo?:boolean }} params
 * @param {(rows:any[]) => void} cb
 * @param {(err:any) => void} [errCb]
 * @returns {() => void} unsubscribe
 */
export function subscribeTechnicians(params, cb, errCb) {
  const {
    especialidad = null,
    ciudad = null,
    orden = "rating",
    disponibleSolo = false,
  } = params || {};

  const col = collection(db, TECHS);
  const clauses = [where("publicado", "==", true)];
  if (especialidad) clauses.push(where("especialidades", "array-contains", especialidad));
  if (ciudad) clauses.push(where("ciudad", "==", ciudad));
  if (disponibleSolo) clauses.push(where("disponible", "==", true));

  let primaryField = "ratingPromedio";
  let primaryDir = "desc";
  if (orden === "precio_asc") { primaryField = "tarifaBase"; primaryDir = "asc"; }
  if (orden === "precio_desc") { primaryField = "tarifaBase"; primaryDir = "desc"; }

  const qy = query(col, ...clauses, orderBy(primaryField, primaryDir), orderBy("nombre", "asc"));
  return onSnapshot(
    qy,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    errCb
  );
}
