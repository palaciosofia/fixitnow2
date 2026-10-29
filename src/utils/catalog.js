// src/utils/catalog.js
// Datos y ayudas del catálogo compartidos por varias páginas.

/** Especialidades que un técnico puede elegir (se guardan tal cual en Firestore). */
export const ESPECIALIDADES = [
  "Plomería", "Electricidad", "Carpintería", "Pintura", "Cerrajería",
  "Refrigeración", "Lavadoras / Secadoras", "Neveras", "Aires Acondicionados",
  "Gasodomésticos", "Drywall", "Pisos / Baldosas", "Impermeabilización",
  "Soldadura", "Aluminio / Vidriería", "Domótica básica", "CCTV",
  "Ensamble de muebles", "Jardinería menor", "Tapicería", "Yeso / Estuco",
  "Enchapes", "Iluminación LED", "Paneles solares (básico)",
];

/** Las más buscadas: accesos rápidos en el inicio y el catálogo. */
export const ESPECIALIDADES_DESTACADAS = [
  "Plomería", "Electricidad", "Aires Acondicionados", "Neveras",
  "Lavadoras / Secadoras", "Carpintería", "Cerrajería", "Pintura",
];

/** Precio "desde" del técnico: tarifaBase o el servicio más barato. 0 si no tiene. */
export function priceFrom(tech) {
  const base = Number(tech?.tarifaBase ?? tech?.tarifa);
  if (Number.isFinite(base) && base > 0) return Math.round(base);
  const precios = (tech?.servicios || [])
    .map((s) => Number(s?.precioSugerido))
    .filter((n) => Number.isFinite(n) && n > 0);
  return precios.length ? Math.round(Math.min(...precios)) : 0;
}

/** Título corto de lo que hace: su primer servicio, o sus especialidades. */
export function techHeadline(tech) {
  const servicio = (tech?.servicios || []).find((s) => s?.nombre)?.nombre;
  if (servicio) return servicio;
  const esp = (tech?.especialidades || []).slice(0, 2).join(" y ");
  return esp || "Servicios técnicos";
}

/** Ruta del perfil público. */
export function techPath(tech) {
  const id = tech?.id || tech?.uid || "";
  return tech?.slug ? `/tecnicos/${tech.slug}` : `/tecnicos/${id}`;
}

/** ¿Es de los mejor calificados? (para la etiqueta "Top") */
export function isTopRated(tech) {
  const r = Number(tech?.ratingPromedio);
  const n = Number(tech?.["reseñasCount"] ?? 0);
  return Number.isFinite(r) && r >= 4.8 && n >= 5;
}
