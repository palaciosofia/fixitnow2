// src/services/payments.js
//
// Flujo de pagos:
//   1. Al crear la reserva se crea un pago en estado "pending".
//   2. El cliente REPORTA su pago (método + comprobante)  → "reported" (en revisión).
//   3. El técnico CONFIRMA el pago                       → "paid".
//      o lo RECHAZA (no le llegó)                        → "pending" otra vez.
//   4. Si la reserva se cancela                          → "cancelled".
//
// La reserva (/reservas/{id}) guarda una copia de `paymentStatus` para poder
// mostrar el estado sin leer el pago; todas las funciones de este archivo
// mantienen ambos documentos sincronizados.
import { app, auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { formatCOP } from "../utils/money";

export const BOOKINGS = "reservas";
const PAYMENTS = "payments";

/**
 * @typedef {"pending"|"reported"|"paid"|"failed"|"refunded"|"cancelled"} PaymentStatus
 *
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} bookingId     - ID de la reserva en /reservas
 * @property {string} clientId      - UID del cliente
 * @property {string|null} clientName
 * @property {string} technicianId  - ID del doc del técnico en /technicians
 * @property {string|null} technicianName
 * @property {number} amount        - Monto en COP (lo fija la reserva, no el cliente)
 * @property {PaymentStatus} status
 * @property {"paypal"|"transfer"|"cash"|"manual"|null} method
 * @property {string|null} notes
 * @property {string|null} proofUrl
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Calcula el monto de una reserva a partir del perfil del técnico. */
export function getBookingAmount(tech) {
  const base = Number(tech?.tarifaBase);
  if (Number.isFinite(base) && base > 0) return Math.round(base);

  const precios = (tech?.servicios || [])
    .map((s) => Number(s?.precioSugerido))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (precios.length) return Math.round(Math.min(...precios));

  return 0; // sin precio definido: se acuerda con el técnico
}

/** Actualiza la copia del estado de pago en la reserva (si existe). */
async function syncBookingPaymentStatus(bookingId, status, extra = {}) {
  if (!bookingId) return;
  try {
    await updateDoc(doc(db, BOOKINGS, bookingId), {
      paymentStatus: status,
      paymentUpdatedAt: serverTimestamp(),
      ...extra,
    });
  } catch (err) {
    // La reserva pudo haber sido eliminada; el pago sigue siendo la fuente de verdad.
    console.warn("No se pudo sincronizar el estado de pago en la reserva:", err?.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Creación / lectura                                                 */
/* ------------------------------------------------------------------ */

/**
 * Crea el documento de pago de una reserva.
 * El ID del pago es el mismo de la reserva, así hay exactamente un pago por reserva
 * y se puede leer directo sin consultas.
 * @returns {Promise<string>} paymentId
 */
export async function createPayment({
  bookingId,
  clientId,
  clientName = null,
  technicianId,
  technicianName = null,
  amount = 0,
}) {
  if (!bookingId) throw new Error("Falta bookingId");
  const paymentId = bookingId;

  await setDoc(doc(db, PAYMENTS, paymentId), {
    bookingId,
    clientId,
    clientName,
    technicianId,
    technicianName,
    amount: Number(amount) || 0,
    status: "pending",
    method: null,
    notes: null,
    proofUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reportedAt: null,
    paidAt: null,
  });

  await syncBookingPaymentStatus(bookingId, "pending", { paymentId });
  return paymentId;
}

/** Obtiene un pago por ID (null si no existe). */
export async function getPaymentById(paymentId) {
  if (!paymentId) return null;
  const snap = await getDoc(doc(db, PAYMENTS, paymentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Obtiene el pago de una reserva.
 * Busca por `paymentId` guardado en la reserva, luego por ID igual a la reserva
 * y, para datos antiguos (pagos con ID aleatorio), por el campo `bookingId`.
 * @param {{ id: string, paymentId?: string, clientId?: string, technicianId?: string }} booking
 */
export async function getPaymentByBookingId(booking) {
  if (!booking?.id) return null;

  for (const id of [booking.paymentId, booking.id].filter(Boolean)) {
    const direct = await getPaymentById(id);
    if (direct) return direct;
  }

  // La consulta debe filtrar por el dueño para que la permitan las reglas.
  const uid = auth.currentUser?.uid;
  const ownerFilter =
    uid && uid === booking.clientId
      ? where("clientId", "==", uid)
      : where("technicianId", "==", booking.technicianId ?? uid ?? "");

  const snap = await getDocs(
    query(
      collection(db, PAYMENTS),
      where("bookingId", "==", booking.id),
      ownerFilter,
      limit(1)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Devuelve el pago de una reserva y, si no existe (reservas creadas cuando
 * fallaba la creación del pago), lo crea a partir de los datos de la reserva.
 */
export async function getOrCreatePaymentForBooking(booking) {
  const existing = await getPaymentByBookingId(booking);
  if (existing) return existing;

  let amount = Number(booking.amount) || 0;
  if (!amount && booking.technicianId) {
    try {
      const t = await getDoc(doc(db, "technicians", booking.technicianId));
      if (t.exists()) amount = getBookingAmount(t.data());
    } catch {
      /* sin acceso al técnico: monto 0 */
    }
  }

  const id = await createPayment({
    bookingId: booking.id,
    clientId: booking.clientId,
    clientName: booking.clientName ?? null,
    technicianId: booking.technicianId,
    technicianName: booking.technicianName ?? null,
    amount,
  });
  return getPaymentById(id);
}

/** Suscripción a los pagos de un cliente. */
export function subscribeClientPayments(clientId, callback, onError) {
  if (!clientId) throw new Error("Missing clientId");
  const q = query(
    collection(db, PAYMENTS),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("Error leyendo pagos del cliente:", err);
      onError?.(err);
    }
  );
}

/** Suscripción a los pagos que recibe un técnico. */
export function subscribeTechnicianPayments(technicianId, callback, onError) {
  if (!technicianId) throw new Error("Missing technicianId");
  const q = query(
    collection(db, PAYMENTS),
    where("technicianId", "==", technicianId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("Error leyendo pagos del técnico:", err);
      onError?.(err);
    }
  );
}

/* ------------------------------------------------------------------ */
/*  Resúmenes (se calculan sobre la lista ya cargada, sin otra lectura) */
/* ------------------------------------------------------------------ */

export function summarizeClientPayments(payments = []) {
  const s = { total: 0, paid: 0, pending: 0, failed: 0 };
  for (const p of payments) {
    const amount = Number(p.amount) || 0;
    if (p.status === "cancelled") continue;
    s.total += amount;
    if (p.status === "paid") s.paid += amount;
    if (p.status === "pending" || p.status === "reported") s.pending += amount;
    if (p.status === "failed") s.failed += amount;
  }
  return s;
}

export function summarizeTechnicianPayments(payments = []) {
  const s = { totalEarned: 0, totalPending: 0, totalRefunded: 0 };
  for (const p of payments) {
    const amount = Number(p.amount) || 0;
    if (p.status === "paid") s.totalEarned += amount;
    if (p.status === "pending" || p.status === "reported") s.totalPending += amount;
    if (p.status === "refunded") s.totalRefunded += amount;
  }
  return s;
}

/* ------------------------------------------------------------------ */
/*  Acciones del cliente                                               */
/* ------------------------------------------------------------------ */

/**
 * El cliente reporta que ya pagó. Queda "en revisión" hasta que el técnico confirme.
 * El monto NO se puede cambiar desde aquí.
 */
export async function reportPaymentByClient(paymentId, { method, notes = "", proofUrl = null }) {
  if (!method) throw new Error("Debes seleccionar un método de pago");

  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error("No se encontró el pago");
  if (payment.status !== "pending") {
    throw new Error("Este pago ya fue reportado o procesado.");
  }

  await updateDoc(doc(db, PAYMENTS, paymentId), {
    status: "reported",
    method,
    notes: notes || null,
    proofUrl: proofUrl || null,
    reportedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await syncBookingPaymentStatus(payment.bookingId, "reported", { paymentMethod: method });
}

/** Sube la foto del comprobante a Firebase Storage y devuelve su URL. */
export async function uploadPaymentProof(paymentId, file) {
  if (!file) throw new Error("No se seleccionó ningún archivo");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen supera 5 MB.");

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const fileRef = ref(getStorage(app), `payments/${paymentId}/proof_${Date.now()}_${safeName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/* ------------------------------------------------------------------ */
/*  Acciones del técnico / admin                                       */
/* ------------------------------------------------------------------ */

/** El técnico confirma que recibió el pago. */
export async function confirmPayment(paymentId, { method } = {}) {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error("No se encontró el pago");

  const finalMethod = method || payment.method || "manual";
  await updateDoc(doc(db, PAYMENTS, paymentId), {
    status: "paid",
    method: finalMethod,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await syncBookingPaymentStatus(payment.bookingId, "paid", { paymentMethod: finalMethod });
}

/** El técnico indica que el pago reportado no le llegó: vuelve a "pending". */
export async function rejectPayment(paymentId, reason = "") {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error("No se encontró el pago");

  await updateDoc(doc(db, PAYMENTS, paymentId), {
    status: "pending",
    notes: reason ? `Rechazado por el técnico: ${reason}` : payment.notes ?? null,
    reportedAt: null,
    updatedAt: serverTimestamp(),
  });
  await syncBookingPaymentStatus(payment.bookingId, "pending");
}

/**
 * Marca como pagada una reserva (desde la Agenda del técnico).
 * Si la reserva no tiene documento de pago, lo crea primero.
 */
export async function markBookingPaid(booking) {
  const payment = await getOrCreatePaymentForBooking(booking);
  await confirmPayment(payment.id, { method: payment.method || "manual" });
}

/**
 * Cancela una reserva: libera la franja (borra el doc de la reserva) y deja el
 * pago marcado como "cancelled" para que quede trazabilidad. Un pago ya
 * confirmado no se toca: el reembolso se coordina por fuera.
 */
export async function cancelBookingAndPayment(booking) {
  const payment = await getPaymentByBookingId(booking).catch(() => null);
  const batch = writeBatch(db);

  if (payment && payment.status !== "paid") {
    batch.update(doc(db, PAYMENTS, payment.id), {
      status: "cancelled",
      updatedAt: serverTimestamp(),
    });
  }
  batch.delete(doc(db, BOOKINGS, booking.id));
  await batch.commit();
}

/* ------------------------------------------------------------------ */
/*  Formato                                                            */
/* ------------------------------------------------------------------ */

export function formatAmount(amount) {
  return formatCOP(Number(amount) || 0);
}
