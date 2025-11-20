// src/services/bookings.js
import { db } from "../firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import dayjs from "dayjs";

export function buildBookingId(tid, date, start /*"HH:00"*/) {
  const ymd = date.replaceAll("-", "");     // 20251023
  const hh  = start.slice(0,2);             // 08
  return `${tid}_${ymd}_${hh}`;
}

export async function createBooking({ tid, uid, date, start, amount = 0 }) {
  const end = dayjs(`${date} ${start}`).add(1, "hour").format("HH:00");
  const id  = buildBookingId(tid, date, start);
  const ref = doc(db, "bookings", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("already-booked");
    tx.set(ref, {
      tid,
      uid,
      date,
      start,
      end,
      createdAt: serverTimestamp(),
      status: "confirmed",

      // 🔽 mismos campos de pago que en bookings.service.js
      paymentStatus: "pending",
      paymentMethod: null,
      paymentNote: null,
      paymentUpdatedAt: null,
      amount,
    });
  });

  // 🔽 Crear documento de pago automáticamente si amount > 0
  if (amount > 0) {
    const { createPayment } = await import("./payments");
    try {
      await createPayment({
        bookingId: id,
        clientId: uid,
        technicianId: tid,
        amount,
      });
    } catch (err) {
      console.warn("No pudimos crear el documento de pago:", err);
      // No lanzamos error - la reserva se creó igualmente
    }
  }

  return { id, date, start, end };
}
