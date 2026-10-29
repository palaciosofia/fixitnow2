import { useEffect, useState } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/** Devuelve { tid, loading } para el técnico cuyo uid == auth.uid */
export default function useMyTechId(uid) {
  const [tid, setTid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setTid(null); setLoading(false); return; }
    const q = query(
      collection(db, "technicians"),
      where("uid", "==", uid),
      limit(1)
    );
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTid(snap.empty ? null : snap.docs[0].id);
        setLoading(false);
      },
      (err) => {
        console.error("Error buscando el perfil de técnico:", err);
        setTid(null);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { tid, loading };
}
