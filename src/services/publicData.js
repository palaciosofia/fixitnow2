// src/services/publicData.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

/** Cantidad estándar para el preview en Home */
export const TAKE_PREVIEW_TECHS = 6;

/**
 * Lista de técnicos publicados, con filtros opcionales.
 * - Úsalo en catálogo completo pasando un `take` grande o paginando.
 * - En Home usa `fetchPublicTechniciansPreview()` para traer solo 6.
 */
export async function fetchPublicTechnicians({ ciudad, especialidad, take = 24 } = {}) {
  const col = collection(db, "technicians");
  const conditions = [where("publicado", "==", true)];
  if (ciudad?.trim()) conditions.push(where("ciudad", "==", ciudad.trim()));
  if (especialidad?.trim()) conditions.push(where("especialidades", "array-contains", especialidad.trim()));

  const q = query(col, ...conditions, orderBy("ratingPromedio", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Helper para Home: devuelve solo 6 técnicos (preview).
 * Ejemplo en Home:
 *   const techs = await fetchPublicTechniciansPreview({ ciudad, especialidad });
 */
export async function fetchPublicTechniciansPreview({ ciudad, especialidad } = {}) {
  return fetchPublicTechnicians({ ciudad, especialidad, take: TAKE_PREVIEW_TECHS });
}

export async function fetchTechnicianPublicById(id) {
  const ref = doc(db, "technicians", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || !snap.data().publicado) return null;
  return { id: snap.id, ...snap.data() };
}

export async function fetchPublicReviewsStrip({ take = 6 } = {}) {
  const col = collection(db, "reviews_public");
  const q = query(col, where("aprobada", "==", true), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
