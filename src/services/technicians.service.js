// src/services/technicians.service.js
import { db } from "../firebase";
import {
  collection, doc, getDoc, getDocs, onSnapshot,
  query, where, orderBy, limit
} from "firebase/firestore";

/**
 * @typedef {Object} Technician
 * @property {string} id               // id del doc en Firestore
 * @property {string=} uid             // dueño del perfil
 * @property {string=} nombre
 * @property {string=} ciudad
 * @property {boolean=} publicado
 * @property {string=} slug
 * @property {string=} fotoURL
 * @property {string=} bioCorta
 * @property {Array<string>=} especialidades
 * @property {Object<string, Array<{inicio:string, fin:string}>>=} horarios // ej. { lun:[{inicio:"08:00",fin:"18:00"}] }
 * @property {Object<string, Array<string>>=} excepciones // ej. { "2025-10-23":["12:00","13:00"] }
 */

/** Mapea DocumentSnapshot -> Technician (inyecta id) */
function mapDoc(d) {
  /** @type {Technician} */
  const obj = { id: d.id, ...d.data() };
  return obj;
}

/**
 * Lista técnicos publicados (una sola lectura).
 * @param {{max?: number, ciudad?: string, esp?: string}=} opts
 * @returns {Promise<Technician[]>}
 */
export async function listPublishedTechs(opts = {}) {
  const { max = 60, ciudad, esp } = opts;

  let qRef = query(
    collection(db, "technicians"),
    where("publicado", "==", true),
    orderBy("nombre", "asc"),
    limit(max)
  );

  // Filtros opcionales
  // Nota: si agregas where extra con orderBy quizá necesites índices
  if (ciudad) {
    qRef = query(collection(db, "technicians"),
      where("publicado", "==", true),
      where("ciudad", "==", ciudad),
      orderBy("nombre", "asc"),
      limit(max)
    );
  }

  const snap = await getDocs(qRef);
  return snap.docs.map(mapDoc);
}

/**
 * Obtiene un técnico por id.
 * @param {string} tid
 * @returns {Promise<Technician|null>}
 */
export async function getTechById(tid) {
  const snap = await getDoc(doc(db, "technicians", tid));
  return snap.exists() ? mapDoc(snap) : null;
}

/**
 * Suscribe a técnicos publicados (catálogo en vivo).
 * @param {(rows: Technician[]) => void} cb
 * @param {(err: any) => void} [errCb]
 * @returns {() => void} unsubscribe
 */
export function subscribePublishedTechs(cb, errCb) {
  const qRef = query(
    collection(db, "technicians"),
    where("publicado", "==", true),
    orderBy("nombre", "asc")
  );
  return onSnapshot(qRef, (snap) => {
    cb(snap.docs.map(mapDoc));
  }, errCb);
}
