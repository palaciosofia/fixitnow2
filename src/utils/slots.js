// src/utils/slots.js
import dayjs from "dayjs";

/**
 * Mapea dayjs().day() (0..6) a claves de horarios definidas en el técnico.
 * Ej.: tech.horarios = { lun: [...], mar: [...], ... }
 */
const DIAS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

/**
 * Devuelve slots horarios "HH:00" disponibles de un técnico para una fecha dada.
 * - tech.horarios: { "lun":[{inicio:"09:00",fin:"18:00"}], ... }
 * - tech.excepciones: { "YYYY-MM-DD": ["HH:00","HH:00"] }  // horas NO atendidas ese día
 * - date: "YYYY-MM-DD"
 * Retorna: ["09:00","10:00","11:00", ...]
 */
export function buildHourlySlots(tech, date) {
  const excepciones = tech?.excepciones?.[date] || [];
  const dow = DIAS[dayjs(date).day()]; // "lun" | "mar" | ...
  const franjas = tech?.horarios?.[dow] || []; // array de {inicio, fin}

  const slots = [];
  for (const f of franjas) {
    if (!f?.inicio || !f?.fin) continue;
    const hIni = parseInt(String(f.inicio).slice(0, 2), 10);
    const hFin = parseInt(String(f.fin).slice(0, 2), 10);
    if (!Number.isFinite(hIni) || !Number.isFinite(hFin)) continue;

    for (let h = hIni; h < hFin; h++) {
      const hh = `${String(h).padStart(2, "0")}:00`;
      if (!excepciones.includes(hh)) slots.push(hh);
    }
  }
  // Sin duplicados por si había franjas que se tocan
  return Array.from(new Set(slots)).sort();
}

/**
 * Construye el ID ÚNICO de la reserva por franja:
 *   tid_YYYYMMDD_HH
 * - tid: id del documento del técnico
 * - scheduledAt: Date o dayjs() con la fecha/hora de la reserva
 */
export function buildSlotId(tid, scheduledAt) {
  const d = dayjs(scheduledAt);
  const ymd = d.format("YYYYMMDD");
  const hh = d.format("HH"); // redondeado a la hora
  return `${tid}_${ymd}_${hh}`;
}

/**
 * Convierte una fecha (Date, dayjs o string) a "YYYY-MM-DD".
 */
export function toYMD(input) {
  return dayjs(input).format("YYYY-MM-DD");
}

/**
 * Combina "YYYY-MM-DD" + "HH:00" -> Date (objeto JS).
 * Útil para guardar scheduledAt como Timestamp en Firestore.
 */
export function combineDateTime(dateYMD, hourHH) {
  // Asume hora exacta en incrementos de 1 hora: "HH:00"
  return dayjs(`${dateYMD}T${hourHH}`).toDate();
}

/**
 * ¿La franja ya pasó (comparada con ahora)?
 * dateYMD: "YYYY-MM-DD", hourHH: "HH:00"
 */
export function isPastSlot(dateYMD, hourHH) {
  return dayjs(`${dateYMD}T${hourHH}`).isBefore(dayjs());
}

/**
 * Devuelve el label “humano” de una fecha ("YYYY-MM-DD") ej.: "Monday, 20 Oct 2025"
 * (configura localización de dayjs aparte si quieres en español)
 */
export function formatLongDate(dateYMD) {
  return dayjs(dateYMD).format("dddd, DD MMM YYYY");
}
