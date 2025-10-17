// src/services/bookings.service.js
import { db } from "../firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, serverTimestamp
} from "firebase/firestore";

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} tid
 * @property {string} uid
 * @property {string} date      // YYYY-MM-DD
 * @property {string} start     // HH:00
 * @property {string} end       // HH:00
 * @property {"confirmed"|"cancelled"} status
 * @property {any=} createdAt
 */

/** Regex helpers */
const RX_HH = /^(0\d|1\d|2[0-3]):00$/;         // "HH:00"
const RX_YMD = /^\d{4}-\d{2}-\d{2}$/;          // "YYYY-MM-DD"

/** Validaciones básicas de formato */
function assertHour(hh, label = "hour") {
  if (!RX_HH.test(hh)) throw new Error(`Invalid ${label}: expected "HH:00", got "${hh}"`);
}
function assertYMD(ymd, label = "date") {
  if (!RX_YMD.test(ymd)) throw new Error(`Invalid ${label}: expected "YYYY-MM-DD", got "${ymd}"`);
}

/** Suma 1 hora a "HH:00" → devuelve "HH:00" (24h) */
export function add1h(hh) {
  assertHour(hh);
  const H = (parseInt(hh.slice(0, 2), 10) + 1) % 24;
  return String(H).padStart(2, "0") + ":00";
}

/** Construye el ID único: tid_YYYYMMDD_HH */
export function buildBookingId(tid, date /*YYYY-MM-DD*/, start /*HH:00*/) {
  if (!tid) throw new Error("Missing tid");
  assertYMD(date);
  assertHour(start);
  const ymd = date.replaceAll("-", ""); // 20251023
  const hh = start.slice(0, 2);         // 08
  return `${tid}_${ymd}_${hh}`;
}

/**
 * Crea una reserva atómica (anti-doble).
 * - Garantiza formato
 * - ID único por franja
 * - status = "confirmed"
 * @param {{ tid: string, uid: string, date: string, start: string, end?: string }} p
 * @returns {Promise<string>} bookingId
 */
export async function createBooking(p) {
  const { tid, uid, date, start } = p;
  if (!tid) throw new Error("Missing tid");
  if (!uid) throw new Error("Missing uid");
  assertYMD(date);
  assertHour(start);

  const end = p.end ?? add1h(start);
  assertHour(end, "end");

  const id = buildBookingId(tid, date, start);
  const ref = doc(db, "bookings", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("already-booked");
    /** @type {Booking} */
    const data = {
      tid, uid, date, start, end,
      status: "confirmed",
      createdAt: serverTimestamp(),
    };
    tx.set(ref, data);
  });

  return id;
}

/**
 * Cancelar (delete). Reglas ya permiten:
 *  - dueño (cliente)
 *  - dueño del técnico
 *  - admin
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function cancelBooking(id) {
  const ref = doc(db, "bookings", id);
  // delete se hace fuera de transaction (suficiente aquí)
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(ref);
}

/**
 * Suscribe reservas por UID (Mis reservas).
 * @param {string} uid
 * @param {(rows: Booking[]) => void} cb
 * @param {(err: any) => void} [errCb]
 * @returns {() => void} unsubscribe
 */
export function subscribeBookingsByUid(uid, cb, errCb) {
  if (!uid) throw new Error("Missing uid");
  const qRef = query(
    collection(db, "bookings"),
    where("uid", "==", uid),
    orderBy("date", "asc"),
    orderBy("start", "asc")
  );
  return onSnapshot(qRef, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, errCb);
}

/**
 * Suscribe reservas por TID (Agenda técnico).
 * @param {string} tid
 * @param {(rows: Booking[]) => void} cb
 * @param {(err: any) => void} [errCb]
 * @returns {() => void} unsubscribe
 */
export function subscribeBookingsByTid(tid, cb, errCb) {
  if (!tid) throw new Error("Missing tid");
  const qRef = query(
    collection(db, "bookings"),
    where("tid", "==", tid),
    orderBy("date", "asc"),
    orderBy("start", "asc")
  );
  return onSnapshot(qRef, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, errCb);
}
