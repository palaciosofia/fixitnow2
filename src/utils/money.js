// src/utils/money.js
// Formato único de moneda para toda la app: pesos colombianos.

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 85000 → "$ 85.000". Devuelve `fallback` si el valor no es un número válido. */
export function formatCOP(value, fallback = "—") {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return fallback;
  return COP.format(n);
}
