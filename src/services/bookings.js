// src/services/bookings.js
import { db } from "../firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import dayjs from "dayjs";

export function buildBookingId(tid, date, start /*"HH:00"*/) {
  const ymd = date.replaceAll("-", "");     // 20251023
  const hh  = start.slice(0,2);             // 08
  return `${tid}_${ymd}_${hh}`;             // tec_ana-pere_00_20251023_08
}

export async function createBooking({ tid, uid, date, start }) {
  const end = dayjs(`${date} ${start}`).add(1, "hour").format("HH:00");
  const id  = buildBookingId(tid, date, start);
  const ref = doc(db, "bookings", id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("already-booked");
    tx.set(ref, {
      tid, uid, date, start, end,
      createdAt: serverTimestamp(),
      status: "confirmed",
    });
  });

  return { id, date, start, end };
}
