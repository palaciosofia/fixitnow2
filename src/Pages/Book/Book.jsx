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
  // buildHourlySlots,            // ❌ ya no lo usamos
  combineDateTime,
  buildSlotId,
} from "../../utils/slots";

/** Genera horas locales sin consultar disponibilidad */
function generateHours(start = 8, end = 19) {
  const arr = [];
  for (let h = start; h <= end; h++) {
    arr.push(`${String(h).padStart(2, "0")}:00`);
  }
  return arr;
}

export default function Book() {
  const { tid } = useParams(); // id del técnico (docId)
  const { user } = useAuth();  // cliente autenticado
  const nav = useNavigate();

  const [tech, setTech] = useState(null);
  const [warn, setWarn] = useState(""); // aviso no bloqueante
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
        if (!snap.exists()) {
          // Modo degradado: permitir reservar igual usando solo tid
          setWarn("No se pudo cargar el perfil del técnico. Continuas sin perfil.");
          setTech({ id: tid });
        } else {
          setTech({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        // p.ej. 403 por no publicado: continuar
        console.error(e);
        setWarn("No se pudo leer el perfil del técnico. Reservarás sin validaciones de horario.");
        setTech({ id: tid });
      } finally {
        setLoading(false);
      }
    })();
  }, [tid]);

  // Horas disponibles: locales (08:00–19:00), no dependen de horarios del técnico
  const horasDisponibles = useMemo(() => {
    if (!fecha) return [];
    return generateHours(8, 19);
  }, [fecha]);

  // Validaciones mínimas (sin mirar disponibilidad)
  function validateInputs() {
    if (!user?.uid) return "Debes iniciar sesión como cliente para reservar.";
    if (!fecha || !hora) return "Selecciona fecha y hora.";
    const d = combineDateTime(fecha, hora);
    if (!d || isNaN(d.getTime())) return "Fecha u hora inválidas.";
    if (d.getTime() < Date.now() - 60_000) return "La fecha/hora debe ser futura.";
    return null;
    // 👇 Importante: ya NO validamos contra buildHourlySlots
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

      const start = hora; // "HH:00"
      const end = dayjs(`${fecha}T${start}`).add(1, "hour").format("HH:00");
      const scheduledAtDate = combineDateTime(fecha, start);
      const scheduledAt = Timestamp.fromDate(scheduledAtDate);
      const rid = buildSlotId(tid, scheduledAtDate); // tid_YYYYMMDD_HH

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "reservas", rid);
        const existing = await tx.get(ref);
        if (existing.exists()) {
          // Mantiene protección anti doble booking por el mismo rid,
          // pero no requiere "slots" precreados.
          throw new Error("Ese horario ya está reservado.");
        }

        tx.set(ref, {
          technicianId: tech?.id || tid,
          technicianName: tech?.nombre || "",
          technicianCiudad: tech?.ciudad || "",
          technicianSlug: tech?.slug || null,

          clientId: user.uid,
          clientName: user.displayName || null,
          clientEmail: user.email || null,

          date: fecha,        // "YYYY-MM-DD"
          start,              // "HH:00"
          end,                // "HH:00"
          scheduledAt,        // Timestamp
          description: (desc || "").trim(),

          status: "solicitada",   // solicitada | confirmada | cancelada
          createdAt: serverTimestamp(),
          fuente: "web",
        });
      });

      alert("Reserva enviada ✅. Te avisaremos cuando el técnico confirme.");
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
      <h1 className="text-2xl font-semibold mb-2">
        Reservar con {tech?.nombre || tid}
      </h1>
      {warn && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {warn}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-4 bg-white">
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              // si ya había hora, no la invalidamos por slots (porque ya no hay slots)
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Hora</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={!fecha} // ✅ solo depende de tener fecha
          >
            <option value="">Selecciona una hora…</option>
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
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
