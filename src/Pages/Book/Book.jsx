// src/Pages/Book/Book.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthProvider";
import {
  buildHourlySlots,
  combineDateTime,
  buildSlotId,
} from "../../utils/slots";

export default function Book() {
  const { tid } = useParams(); // id del técnico (docId)
  const { user } = useAuth();  // cliente autenticado
  const nav = useNavigate();

  const [tech, setTech] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // estado del formulario
  const [fecha, setFecha] = useState(""); // YYYY-MM-DD
  const [hora, setHora] = useState("");   // HH:00
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    if (!tid) {
      setErr("Falta el id del técnico (tid).");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "technicians", tid));
        if (!snap.exists()) throw new Error("Técnico no encontrado");
        setTech({ id: snap.id, ...snap.data() });
      } catch (e) {
        setErr(e?.message || "Error cargando técnico");
      } finally {
        setLoading(false);
      }
    })();
  }, [tid]);

  // Slots disponibles según horarios del técnico y la fecha elegida
  const horasDisponibles = useMemo(() => {
    if (!tech || !fecha) return [];
    return buildHourlySlots(tech, fecha); // ["09:00","10:00", ...]
  }, [tech, fecha]);

  // helper: valida fecha/hora futura y que pertenezca a los slots
  function validateInputs() {
    if (!user?.uid) return "Debes iniciar sesión como cliente para reservar.";
    if (!fecha || !hora) return "Selecciona fecha y hora.";
    // la hora debe estar en la lista de disponibles (horarios + excepciones)
    if (horasDisponibles.length && !horasDisponibles.includes(hora)) {
      return "La hora seleccionada no está disponible para ese día.";
    }
    const d = combineDateTime(fecha, hora);
    if (!d || isNaN(d.getTime())) return "Fecha u hora inválidas.";
    // no permitir reservas en el pasado (margen 1 min)
    if (d.getTime() < Date.now() - 60_000) {
      return "La fecha/hora debe ser futura.";
    }
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormErr("");

    const v = validateInputs();
    if (v) {
      setFormErr(v);
      return;
    }

    try {
      setSaving(true);

      // Datos base
      const start = hora;                                  // "HH:00"
      const end = dayjs(`${fecha}T${start}`).add(1, "hour").format("HH:00");
      const scheduledAtDate = combineDateTime(fecha, start);
      const scheduledAt = Timestamp.fromDate(scheduledAtDate);
      const rid = buildSlotId(tid, scheduledAtDate);       // tid_YYYYMMDD_HH

      // Transacción: crea doc solo si NO existe (bloquea doble booking)
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "reservas", rid);
        const existing = await tx.get(ref);
        if (existing.exists()) {
          throw new Error("Ese horario ya está reservado.");
        }

        tx.set(ref, {
          technicianId: tech.id,
          technicianName: tech?.nombre || "",
          technicianCiudad: tech?.ciudad || "",
          technicianSlug: tech?.slug || null,

          clientId: user.uid,
          clientName: user.displayName || null,
          clientEmail: user.email || null,

          date: fecha,        // "YYYY-MM-DD"
          start,              // "HH:00"
          end,                // "HH:00"
          scheduledAt,        // Timestamp (útil para ordenar)
          description: (desc || "").trim(),

          status: "solicitada",   // solicitada | confirmada | cancelada
          createdAt: serverTimestamp(),
          fuente: "web",
        });
      });

      alert("Reserva enviada. Te avisaremos cuando el técnico confirme.");
      nav("/mis-reservas");
    } catch (e) {
      console.error(e);
      setFormErr(e?.message || "No pudimos crear la reserva. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Cargando…</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!tech) return null;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Reservar con {tech?.nombre || "Técnico"}
      </h1>

      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-4">
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              // si la hora elegida ya no está disponible para ese día, limpiar
              if (hora && !buildHourlySlots(tech, e.target.value).includes(hora)) {
                setHora("");
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Hora</label>
          {/*  */}
          <select
            className="border rounded px-3 py-2 w-full"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={!fecha || horasDisponibles.length === 0}
          >
            <option value="">Selecciona una hora…</option>
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {/* 
          />
          */}
        </div>

        <div>
          <label className="block text-sm mb-1">Descripción del trabajo</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows="3"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe brevemente el trabajo que necesitas…"
          />
        </div>

        {formErr && <div className="text-sm text-red-600">{formErr}</div>}

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
        >
          {saving ? "Enviando…" : "Confirmar reserva"}
        </button>
      </form>
    </div>
  );
}
