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
  collection,
  setDoc,
} from "firebase/firestore";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthProvider";
import {
  combineDateTime,
  buildSlotId,
} from "../../utils/slots";
import { createPayment } from "../../services/payments";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Loader, ArrowLeft } from "lucide-react";

/** Genera horas locales sin consultar disponibilidad */
function generateHours(start = 8, end = 19) {
  const arr = [];
  for (let h = start; h <= end; h++) {
    arr.push(`${String(h).padStart(2, "0")}:00`);
  }
  return arr;
}

export default function Book() {
  const { tid } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [tech, setTech] = useState(null);
  const [warn, setWarn] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
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
          setWarn("No se pudo cargar el perfil del técnico. Continúas sin perfil.");
          setTech({ id: tid });
        } else {
          setTech({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error(e);
        setWarn("No se pudo leer el perfil del técnico. Reservarás sin validaciones de horario.");
        setTech({ id: tid });
      } finally {
        setLoading(false);
      }
    })();
  }, [tid]);

  const horasDisponibles = useMemo(() => {
    if (!fecha) return [];
    return generateHours(8, 19);
  }, [fecha]);

  function validateInputs() {
    if (!user?.uid) return "Debes iniciar sesión como cliente para reservar.";
    if (!fecha || !hora) return "Selecciona fecha y hora.";
    const d = combineDateTime(fecha, hora);
    if (!d || isNaN(d.getTime())) return "Fecha u hora inválidas.";
    if (d.getTime() < Date.now() - 60_000) return "La fecha/hora debe ser futura.";
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

      const start = hora;
      const end = dayjs(`${fecha}T${start}`).add(1, "hour").format("HH:00");
      const scheduledAtDate = combineDateTime(fecha, start);
      const scheduledAt = Timestamp.fromDate(scheduledAtDate);
      const rid = buildSlotId(tid, scheduledAtDate);

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "reservas", rid);
        const existing = await tx.get(ref);
        if (existing.exists()) {
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

          date: fecha,
          start,
          end,
          scheduledAt,
          description: (desc || "").trim(),

          status: "solicitada",
          createdAt: serverTimestamp(),
          fuente: "web",
          
          // 🔽 Campos de pago iniciales
          paymentStatus: "pending",
          paymentMethod: null,
          paymentNote: null,
          paymentUpdatedAt: null,
        });
      });

      // 🔽 Crear documento de pago automáticamente
      // Monto sugerido (obtener del técnico o usar default de 1)
      // Si el técnico no tiene precio sugerido, usamos 1 para crear el pago
      const amount = tech?.precioSugerido || 1;
      console.log("💰 Intentando crear pago con:", {
        bookingId: rid,
        clientId: user.uid,
        technicianId: tech?.id || tid,
        amount,
      });
      
      try {
        const paymentId = await createPayment({
          bookingId: rid,
          clientId: user.uid,
          technicianId: tech?.id || tid,
          amount,
        });
        console.log("✅ Pago creado exitosamente. ID:", paymentId);
      } catch (err) {
        console.error("❌ Error CRÍTICO al crear documento de pago:", {
          message: err.message,
          code: err.code,
          details: err,
        });
        // La reserva se creó igualmente, el pago es un detalle
      }

      alert("✅ Reserva enviada correctamente. Te avisaremos cuando el técnico confirme.");
      nav("/mis-reservas");
    } catch (e) {
      console.error(e);
      setFormErr(e?.message || "No pudimos crear la reserva. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando información…</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center border-2 border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{err}</p>
          <button
            onClick={() => nav("/")}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!tech) return null;

  const fechaFormato = fecha ? dayjs(fecha).format("dddd, D MMMM YYYY") : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => nav(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-black mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Reserva con{" "}
            <span className="text-yellow-300">{tech?.nombre || tid}</span>
          </h1>
          <p className="text-white/90 text-lg">Completa el formulario para solicitar tu reserva</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Warning Banner */}
        {warn && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Información</h3>
              <p className="text-amber-800">{warn}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={onSubmit} className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
              {/* Fecha */}
              <div className="mb-8">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Selecciona la fecha
                </label>
                <input
                  type="date"
                  className="w-full"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setHora("");
                  }}
                  min={dayjs().format("YYYY-MM-DD")}
                />
                {fecha && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
                    📅 {fechaFormato}
                  </div>
                )}
              </div>

              {/* Hora */}
              <div className="mb-8">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>
                  <Clock className="w-5 h-5 text-teal-600" />
                  Selecciona la hora
                </label>
                <select
                  className="w-full"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  disabled={!fecha}
                >
                  <option value="">
                    {fecha ? "Selecciona una hora…" : "Primero selecciona una fecha"}
                  </option>
                  {horasDisponibles.map((h) => (
                    <option key={h} value={h}>
                      {h} - {dayjs(`2025-01-01T${h}`).add(1, "hour").format("HH:00")}
                    </option>
                  ))}
                </select>
                {hora && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800 font-medium">
                    🕐 {hora}
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="mb-8">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>
                  <FileText className="w-5 h-5 text-blue-600" />
                  Describe tu necesidad
                </label>
                <textarea
                  className="w-full rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 p-4 resize-none"
                  rows="5"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe el trabajo que necesitas. Ejemplo: Reparación de aire acondicionado, instalación de cortinas, etc."
                  style={{fontFamily: 'DM Sans, sans-serif'}}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {desc.length}/500 caracteres
                </div>
              </div>

              {/* Error */}
              {formErr && (
                <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800">Error en la reserva</h4>
                    <p className="text-red-700 text-sm mt-1">{formErr}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving || !fecha || !hora}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              >
                {saving ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    Enviando reserva…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Confirmar reserva
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resumen Técnico */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-lg border-2 border-emerald-100 p-8 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-6" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Resumen
              </h3>

              {/* Técnico Info */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Técnico</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(tech?.nombre || "T").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tech?.nombre || tid}</p>
                    {tech?.ciudad && <p className="text-sm text-gray-600">📍 {tech.ciudad}</p>}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 mb-6"></div>

              {/* Resumen de Booking */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Fecha</p>
                  <p className="text-lg font-bold text-gray-900">
                    {fecha ? fechaFormato : "No seleccionada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hora</p>
                  <p className="text-lg font-bold text-gray-900">
                    {hora ? `${hora} - ${dayjs(`2025-01-01T${hora}`).add(1, "hour").format("HH:00")}` : "No seleccionada"}
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 my-6"></div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${user ? 'bg-emerald-100 border-emerald-500' : 'border-gray-300'}`}>
                    {user && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className={`text-sm font-medium ${user ? 'text-emerald-700' : 'text-gray-500'}`}>
                    Sesión iniciada
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${fecha ? 'bg-emerald-100 border-emerald-500' : 'border-gray-300'}`}>
                    {fecha && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className={`text-sm font-medium ${fecha ? 'text-emerald-700' : 'text-gray-500'}`}>
                    Fecha seleccionada
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hora ? 'bg-emerald-100 border-emerald-500' : 'border-gray-300'}`}>
                    {hora && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <span className={`text-sm font-medium ${hora ? 'text-emerald-700' : 'text-gray-500'}`}>
                    Hora seleccionada
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
