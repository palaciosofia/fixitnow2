// src/utils/paymentStatus.js
// Etiquetas y clases de cada estado de pago.
// Las clases van escritas completas para que Tailwind las detecte al compilar
// (las clases armadas con template strings, p. ej. `bg-${color}-100`, no se generan).

export const PAYMENT_STATUS = {
  pending: {
    label: "Pago pendiente",
    short: "Pendiente",
    icon: "⏳",
    badge: "bg-yellow-100 text-yellow-800",
    border: "border-yellow-400",
    hover: "hover:bg-yellow-50",
  },
  reported: {
    label: "En revisión",
    short: "En revisión",
    icon: "🔎",
    badge: "bg-sky-100 text-sky-800",
    border: "border-sky-400",
    hover: "hover:bg-sky-50",
  },
  paid: {
    label: "Pagado",
    short: "Pagado",
    icon: "✓",
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-400",
    hover: "hover:bg-emerald-50",
  },
  failed: {
    label: "Pago fallido",
    short: "Fallido",
    icon: "✕",
    badge: "bg-red-100 text-red-800",
    border: "border-red-400",
    hover: "hover:bg-red-50",
  },
  refunded: {
    label: "Reembolsado",
    short: "Reembolsado",
    icon: "↶",
    badge: "bg-blue-100 text-blue-800",
    border: "border-blue-400",
    hover: "hover:bg-blue-50",
  },
  cancelled: {
    label: "Cancelado",
    short: "Cancelado",
    icon: "⊘",
    badge: "bg-gray-100 text-gray-700",
    border: "border-gray-300",
    hover: "hover:bg-gray-50",
  },
};

export function paymentStatusMeta(status) {
  return PAYMENT_STATUS[status] || PAYMENT_STATUS.pending;
}

export const PAYMENT_METHOD_LABEL = {
  paypal: "🅿️ PayPal",
  transfer: "🏦 Transferencia",
  cash: "💵 Efectivo",
  card: "💳 Tarjeta",
  manual: "✍️ Registrado por el técnico",
};
