// src/Pages/Tecnico/Agenda.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthProvider";
import useMyTechId from "../../hooks/useMyTechId";
import { Clock, User, Trash2, Check, X, Calendar, MapPin, MessageSquare, Star, Sparkles } from "lucide-react";

/* ---------- Helpers con scheduledAt: Timestamp ---------- */
function keyFromTs(ts) {
  try {
    const d = ts?.toDate?.();
    return d ? dayjs(d).format("YYYY-MM-DD") : null;
  } catch {
    return null;
  }
}
function groupByDate(rows = []) {
  const map = {};
  for (const r of rows) {
    const k = keyFromTs(r.scheduledAt);
    if (!k) continue;
    (map[k] ||= []).push(r);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}
function toMillis(ts) {
  try {
    return ts?.toMillis?.() ?? 0;
  } catch {
    return 0;
  }
}
function isPastTs(ts) {
  return toMillis(ts) < Date.now();
}
function isWithinNextHoursTs(ts, hours = 2) {
  const ms = toMillis(ts);
  const diffH = (ms - Date.now()) / (1000 * 60 * 60);
  return ms > Date.now() && diffH <= hours;
}
/* -------------------------------------------------------- */

export default function Agenda() {
  const { user } = useAuth(); // técnico autenticado
  const uid = user?.uid;
  const { tid, loading: loadingTid } = useMyTechId(uid); // id del doc en /technicians

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // cache clientId -> display (nombre o email)
  const [clientNames, setClientNames] = useState({});
  const loadingUidsRef = useRef(new Set());

  // Suscribirse a reservas del técnico
  useEffect(() => {
    if (!tid) {
      if (!loadingTid) setLoading(false);
      return;
    }

    const q = query(
      collection(db, "reservas"),
      where("technicianId", "==", tid),
      orderBy("scheduledAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(data);
        setLoading(false);

        // Pre-cargar nombres de clientes que falten
        const missing = data
          .map((r) => r.clientId)
          .filter(Boolean)
          .filter((u) => !clientNames[u] && !loadingUidsRef.current.has(u));
        if (missing.length) missing.forEach(loadClientName);
      },
      (e) => {
        console.error(e);
        setErr(e?.message || "Error al cargar agenda.");
        setLoading(false);
      }
    );

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid, loadingTid]);

  async function loadClientName(userId) {
    try {
      loadingUidsRef.current.add(userId);
      const snap = await getDoc(doc(db, "users", userId));
      let label = userId;
      if (snap.exists()) {
        const d = snap.data();
        // en tus docs de users vi "name" y "email"
        label = d?.name || d?.nombre || d?.displayName || d?.email || userId;
      }
      setClientNames((prev) => ({ ...prev, [userId]: label }));
    } catch {
      setClientNames((prev) => ({ ...prev, [userId]: userId }));
    } finally {
      loadingUidsRef.current.delete(userId);
    }
  }

  // Particiones por tiempo/estado
  const upcoming = useMemo(
    () => rows.filter((r) => !isPastTs(r.scheduledAt) && r.status !== "cancelada"),
    [rows]
  );
  const past = useMemo(
    () => rows.filter((r) => isPastTs(r.scheduledAt) || r.status === "cancelada").reverse(),
    [rows]
  );

  const gUpcoming = useMemo(() => groupByDate(upcoming), [upcoming]);
  const gPast = useMemo(() => groupByDate(past), [past]);

  // Acciones
  async function accept(id) {
    try {
      await updateDoc(doc(db, "reservas", id), { status: "confirmada" });
    } catch (e) {
      console.error(e);
      alert("No se pudo aceptar la reserva.");
    }
  }

  async function cancel(id, ts) {
    // Bloquea cancelación si ya pasó (y protección si falta poco)
    if (isPastTs(ts)) return alert("No puedes cancelar una reserva pasada.");
    if (isWithinNextHoursTs(ts, 2)) {
      const okSoon = confirm("La reserva inicia pronto (≤ 2h). ¿Seguro que quieres cancelarla?");
      if (!okSoon) return;
    } else {
      const ok = confirm("¿Cancelar esta reserva?");
      if (!ok) return;
    }
    try {
      // Opción A: borrar
      await deleteDoc(doc(db, "reservas", id));

      // Opción B: marcar como cancelada (descomenta y comenta deleteDoc):
      // await updateDoc(doc(db, "reservas", id), { status: "cancelada" });
    } catch (e) {
      console.error(e);
      alert("No se pudo cancelar. Intenta de nuevo.");
    }
  }

  if (loadingTid) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
        <p className="text-lg font-semibold text-gray-700">Buscando tu perfil de técnico…</p>
      </div>
    </div>
  );
  
  if (!tid) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-md">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Perfil no encontrado</h3>
        <p className="text-gray-600">No encontramos tu técnico. Crea/actualiza tu perfil en /perfil.</p>
      </div>
    </div>
  );
  
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white animate-bounce" />
        </div>
        <p className="text-lg font-semibold text-gray-700">Cargando agenda…</p>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center bg-white rounded-3xl p-8 shadow-2xl border border-red-200 max-w-md">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{err}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header espectacular */}
        <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-2xl opacity-40"></div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                  Mi Agenda Profesional
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Gestiona tus reservas de manera inteligente y eficiente</p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Próximas</span>
                </div>
                <div className="text-3xl font-black">{upcoming.length}</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[120px]">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Historial</span>
                </div>
                <div className="text-3xl font-black">{past.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Próximas */}
        <SectionTech
          title="Próximas Citas"
          subtitle="Reservas confirmadas y pendientes"
          groups={gUpcoming}
          clientNames={clientNames}
          onAccept={accept}
          onCancel={cancel}
          emptyText="No tienes reservas próximas."
          isUpcoming={true}
        />

        {/* Historial */}
        <SectionTech
          title="Historial de Servicios"
          subtitle="Servicios completados y cancelados"
          groups={gPast}
          clientNames={clientNames}
          onAccept={null}
          onCancel={null}
          emptyText="Sin historial todavía."
          isUpcoming={false}
        />
      </div>
    </div>
  );
}

function SectionTech({ title, subtitle, groups, clientNames, onAccept, onCancel, emptyText, isUpcoming }) {
  return (
    <section className="mb-12">
      {/* Header de sección */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isUpcoming 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {isUpcoming ? (
              <Clock className="w-6 h-6 text-white" />
            ) : (
              <Star className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sin citas programadas</h3>
          <p className="text-gray-600">{emptyText}</p>
        </div>
      )}

      {groups.map(([fecha, items]) => (
        <div key={fecha} className="mb-8">
          {/* Header de fecha */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{dayjs(fecha).format("dddd")}</h3>
                <p className="text-white/90 text-lg">{dayjs(fecha).format("DD MMMM YYYY")}</p>
              </div>
            </div>
          </div>

          {/* Lista de citas */}
          <div className="space-y-4">
            {items.map((it, index) => {
              const when = it.scheduledAt?.toDate?.();
              const whenStr = when ? dayjs(when).format("HH:mm") : "—";
              const clientLabel =
                clientNames[it.clientId] || it.clientName || it.clientEmail || it.clientId;

              const status = normStatus(it.status);
              const past = isPastTs(it.scheduledAt);
              const canAccept = !!onAccept && status === "pending" && !past;
              const canCancel = !!onCancel && status !== "cancelled" && !past;

              return (
                <div 
                  key={it.id} 
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Decoración lateral */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    status === 'confirmed' ? 'bg-emerald-500' :
                    status === 'cancelled' ? 'bg-red-500' :
                    status === 'done' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></div>

                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    
                    {/* Hora destacada */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200 text-center min-w-[100px]">
                        <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Hora</div>
                        <div className="text-2xl font-black text-emerald-700">{whenStr}</div>
                      </div>
                    </div>

                    {/* Información del cliente */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{clientLabel}</div>
                          <div className="text-sm text-gray-500">Cliente</div>
                        </div>
                      </div>

                      {it.description && (
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                          <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Descripción del servicio</div>
                            <div className="text-gray-600">{it.description}</div>
                          </div>
                        </div>
                      )}

                      {it.address && (
                        <div className="flex items-center gap-3 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{it.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Estado y acciones */}
                    <div className="flex-shrink-0 text-right space-y-4">
                      <StatusBadge status={status} />
                      
                      {(canAccept || canCancel) && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          {canAccept && (
                            <button
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
                              onClick={() => onAccept(it.id)}
                              title="Aceptar reserva"
                            >
                              <Check className="w-5 h-5" />
                              Aceptar
                            </button>
                          )}
                          {canCancel && (
                            <button
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold transition-all duration-300"
                              onClick={() => onCancel(it.id, it.scheduledAt)}
                              title="Cancelar reserva"
                            >
                              <Trash2 className="w-5 h-5" />
                              Cancelar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Agregar estilos de animación */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

function normStatus(s = "") {
  s = (s || "").toLowerCase();
  if (s === "confirmada" || s === "confirmed") return "confirmed";
  if (s === "cancelada" || s === "cancelled") return "cancelled";
  if (s === "completada" || s === "completed") return "done";
  return "pending"; // "solicitada" u otros
}

function StatusBadge({ status }) {
  const statusConfig = {
    confirmed: {
      className: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg",
      label: "✓ Confirmada",
      icon: "✓"
    },
    cancelled: {
      className: "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg", 
      label: "✕ Cancelada",
      icon: "✕"
    },
    done: {
      className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg",
      label: "★ Completada", 
      icon: "★"
    },
    pending: {
      className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg",
      label: "⏳ Pendiente",
      icon: "⏳"
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-2xl ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
