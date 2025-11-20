// src/services/payments.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * @typedef {Object} Payment
 * @property {string} id - Documento ID (único)
 * @property {string} bookingId - ID de la reserva asociada
 * @property {string} clientId - UID del cliente
 * @property {string} technicianId - UID del técnico
 * @property {number} amount - Monto en (de la reserva)
 * @property {"pending"|"paid"|"failed"|"refunded"} status
 * @property {"card"|"transfer"|"cash"|null} method - Método de pago
 * @property {string|null} notes - Notas adicionales
 * @property {any} createdAt - Timestamp de creación
 * @property {any} updatedAt - Timestamp de última actualización
 * @property {any} paidAt - Timestamp cuando se marcó como pagado
 */

/**
 * Crea un documento de pago para una reserva
 * @param {{bookingId: string, clientId: string, technicianId: string, amount: number}} params
 * @returns {Promise<string>} Payment ID
 */
export async function createPayment({
  bookingId,
  clientId,
  technicianId,
  amount,
}) {
  const paymentId = `payment_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const ref = doc(db, "payments", paymentId);

  const paymentData = {
    bookingId,
    clientId,
    technicianId,
    amount,
    status: "pending",
    method: null,
    notes: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    paidAt: null,
  };

  try {
    console.log("📝 Creando pago con datos:", {
      paymentId,
      bookingId,
      clientId,
      technicianId,
      amount,
      status: "pending",
    });
    
    await setDoc(ref, paymentData);
    console.log("✅ Pago creado en Firestore:", paymentId);

    // ✅ NUEVO: Guardar paymentId en la reserva para recuperarlo después
    try {
      const reservaRef = doc(db, "reservas", bookingId);
      await updateDoc(reservaRef, {
        paymentId: paymentId,
      });
      console.log("✅ paymentId guardado en reserva:", bookingId);
    } catch (err) {
      console.warn("⚠️ No se pudo actualizar paymentId en reserva:", err.message);
    }

    return paymentId;
  } catch (err) {
    console.error("❌ ERROR al crear pago:", {
      error: err.message,
      code: err.code,
      paymentId,
      clientId,
      bookingId,
    });
    throw err;
  }
}

/**
 * Actualiza el estado de un pago
 * @param {string} paymentId
 * @param {{status: string, method?: string, notes?: string}} updates
 * @returns {Promise<void>}
 */
export async function updatePaymentStatus(paymentId, updates) {
  const ref = doc(db, "payments", paymentId);
  const data = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Si está siendo marcado como pagado, agregar timestamp
  if (updates.status === "paid") {
    data.paidAt = serverTimestamp();
  }

  await updateDoc(ref, data);

  // También actualizar el documento de reserva
  if (updates.status) {
    const snap = await getDocs(
      query(collection(db, "payments"), where("id", "==", paymentId))
    );
    if (snap.size > 0) {
      const payment = snap.docs[0].data();
      await updateDoc(doc(db, "bookings", payment.bookingId), {
        paymentStatus: updates.status,
        paymentUpdatedAt: serverTimestamp(),
      });
    }
  }
}

/**
 * Obtiene todos los pagos de un cliente (como comprador)
 * @param {string} clientId
 * @param {(payments: Payment[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeClientPayments(clientId, callback) {
  if (!clientId) throw new Error("Missing clientId");

  const q = query(
    collection(db, "payments"),
    where("clientId", "==", clientId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(payments);
  });
}

/**
 * Obtiene todos los pagos recibidos por un técnico (como receptor)
 * @param {string} technicianId
 * @param {(payments: Payment[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeTechnicianPayments(technicianId, callback) {
  if (!technicianId) throw new Error("Missing technicianId");

  const q = query(
    collection(db, "payments"),
    where("technicianId", "==", technicianId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(payments);
  });
}

/**
 * Obtiene resumen de pagos de un cliente
 * @param {string} clientId
 * @returns {Promise<{total: number, paid: number, pending: number, failed: number}>}
 */
export async function getClientPaymentsSummary(clientId) {
  const q = query(
    collection(db, "payments"),
    where("clientId", "==", clientId)
  );
  const snap = await getDocs(q);

  let total = 0,
    paid = 0,
    pending = 0,
    failed = 0;

  snap.forEach((doc) => {
    const payment = doc.data();
    total += payment.amount || 0;
    if (payment.status === "paid") paid += payment.amount || 0;
    if (payment.status === "pending") pending += payment.amount || 0;
    if (payment.status === "failed") failed += payment.amount || 0;
  });

  return { total, paid, pending, failed };
}

/**
 * Obtiene resumen de pagos recibidos por un técnico
 * @param {string} technicianId
 * @returns {Promise<{totalEarned: number, totalPending: number, totalRefunded: number}>}
 */
export async function getTechnicianPaymentsSummary(technicianId) {
  const q = query(
    collection(db, "payments"),
    where("technicianId", "==", technicianId)
  );
  const snap = await getDocs(q);

  let totalEarned = 0,
    totalPending = 0,
    totalRefunded = 0;

  snap.forEach((doc) => {
    const payment = doc.data();
    if (payment.status === "paid") totalEarned += payment.amount || 0;
    if (payment.status === "pending") totalPending += payment.amount || 0;
    if (payment.status === "refunded") totalRefunded += payment.amount || 0;
  });

  return { totalEarned, totalPending, totalRefunded };
}

/**
 * Obtiene un pago por ID
 * @param {string} paymentId
 * @returns {Promise<Payment|null>}
 */
export async function getPaymentById(paymentId) {
  const snap = await getDocs(
    query(collection(db, "payments"), where("id", "==", paymentId))
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Obtiene pagos de una reserva específica
 * @param {string} bookingId
 * @returns {Promise<Payment|null>}
 */
export async function getPaymentByBookingId(bookingId) {
  try {
    // ✅ Estrategia 1: Obtener paymentId desde la reserva (para reservas nuevas)
    try {
      const reservaRef = doc(db, "reservas", bookingId);
      const reservaSnap = await getDoc(reservaRef);
      
      if (reservaSnap.exists()) {
        const reservaData = reservaSnap.data();
        if (reservaData.paymentId) {
          // Obtener el pago directamente usando el paymentId
          const paymentRef = doc(db, "payments", reservaData.paymentId);
          const paymentSnap = await getDoc(paymentRef);

          if (paymentSnap.exists()) {
            console.log("✅ Pago encontrado por paymentId:", reservaData.paymentId);
            return { id: paymentSnap.id, ...paymentSnap.data() };
          }
        }
      }
    } catch (err) {
      console.log("⚠️ No se pudo obtener desde paymentId:", err.message);
    }

    // ✅ Estrategia 2: Buscar por bookingId (para reservas antiguas o compatibilidad)
    console.log("🔍 Buscando pago por bookingId:", bookingId);
    const q = query(
      collection(db, "payments"),
      where("bookingId", "==", bookingId)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      console.log("✅ Pago encontrado por bookingId");
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    console.log("❌ No se encontró pago para booking:", bookingId);
    return null;
  } catch (err) {
    console.error("❌ Error obteniendo pago:", err.message);
    throw err;
  }
}

/**
 * Elimina un pago (solo para admin o para pendientes)
 * @param {string} paymentId
 * @returns {Promise<void>}
 */
export async function deletePayment(paymentId) {
  const ref = doc(db, "payments", paymentId);
  await deleteDoc(ref);
}

/**
 * Simula un pago (marca como pagado con método simulado)
 * NOTA: Esto es solo para testing/demo, no es un pago real
 * @param {string} paymentId
 * @param {string} method - "card" | "transfer" | "cash"
 * @returns {Promise<void>}
 */
export async function simulatePayment(paymentId, method = "card") {
  await updatePaymentStatus(paymentId, {
    status: "paid",
    method,
    notes: `Pago simulado por ${method}`,
  });
}

/**
 * Formatea un monto de dinero
 * @param {number} amount
 * @returns {string}
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtiene etiqueta legible del estado
 * @param {string} status
 * @returns {string}
 */
export function getPaymentStatusLabel(status) {
  const labels = {
    pending: "Pago Pendiente",
    paid: "Pagado",
    failed: "Pago Fallido",
    refunded: "Reembolsado",
  };
  return labels[status] || status;
}

/**
 * El cliente marca su pago como realizado
 * @param {string} paymentId
 * @param {{amount: number, method: string, notes?: string}} data
 * @returns {Promise<void>}
 */
export async function markPaymentAsPaidByClient(paymentId, { amount, method, notes = "" }) {
  if (!amount || amount <= 0) throw new Error("El monto debe ser mayor a 0");
  if (!method) throw new Error("Debes seleccionar un método de pago");

  const ref = doc(db, "payments", paymentId);

  await updateDoc(ref, {
    amount, // El cliente puede actualizar el monto si es diferente
    status: "paid",
    method,
    notes: notes || `Pago de ${amount} via ${method}`,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Sube una foto de comprobante de efectivo a Firebase Storage
 * @param {string} paymentId - ID del pago
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} URL descargable de la imagen
 */
export async function uploadCashProof(paymentId, file) {
  try {
    const storage = getStorage();

    // Crear ruta: payments/{paymentId}/proof_{timestamp}.jpg
    const timestamp = Date.now();
    const filename = `proof_${timestamp}_${file.name}`;
    const fileRef = ref(storage, `payments/${paymentId}/${filename}`);

    // Subir archivo
    console.log("📤 Subiendo comprobante a Firebase Storage...");
    const snapshot = await uploadBytes(fileRef, file);
    console.log("✅ Archivo subido:", snapshot.ref.fullPath);

    // Obtener URL descargable
    const downloadUrl = await getDownloadURL(fileRef);
    console.log("✅ URL de comprobante:", downloadUrl);

    return downloadUrl;
  } catch (err) {
    console.error("❌ Error subiendo comprobante:", err);
    throw new Error("No se pudo subir la foto: " + err.message);
  }
}
