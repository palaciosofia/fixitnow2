// src/utils/paymentStatus.js
// Etiquetas y color (tono de <Badge>) de cada estado de pago y de reserva.

export const PAYMENT_STATUS = {
  pending: { tone: "neutral", label: "Pago pendiente", short: "Pendiente" },
  reported: { tone: "info", label: "Pago en revisión", short: "En revisión" },
  paid: { tone: "success", label: "Pagado", short: "Pagado" },
  failed: { tone: "danger", label: "Pago fallido", short: "Fallido" },
  refunded: { tone: "info", label: "Reembolsado", short: "Reembolsado" },
  cancelled: { tone: "neutral", label: "Pago cancelado", short: "Cancelado" },
};

export function paymentStatusMeta(status) {
  return PAYMENT_STATUS[status] || PAYMENT_STATUS.pending;
}

export const PAYMENT_METHOD_LABEL = {
  paypal: "PayPal",
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  manual: "Registrado por el técnico",
};

/* ---------------- Estado de la reserva ---------------- */
const BOOKING_STATUS = {
  solicitada: { label: "Solicitada", tone: "warning" },
  confirmada: { label: "Confirmada", tone: "success" },
  completada: { label: "Completada", tone: "neutral" },
  cancelada: { label: "Cancelada", tone: "danger" },
};

/** Normaliza el estado de una reserva (acepta valores antiguos en inglés). */
export function normalizeBookingStatus(raw) {
  const v = String(raw || "").toLowerCase();
  if (v === "confirmed") return "confirmada";
  if (v === "cancelled") return "cancelada";
  if (v === "completed" || v === "done") return "completada";
  return BOOKING_STATUS[v] ? v : "solicitada";
}

export function bookingStatusMeta(raw) {
  return BOOKING_STATUS[normalizeBookingStatus(raw)];
}
