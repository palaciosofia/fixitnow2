// src/Pages/Cliente/MisReservas.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../../firebase";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, getDoc
} from "firebase/firestore";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthProvider";
import { Clock, User, Phone, XCircle } from "lucide-react";

// ---- Helpers de fecha/agrupación (con scheduledAt: Timestamp) ----
function keyFromTs(ts) {
  try {
    const d = ts?.toDate?.();
    if (!d) return null;
    return dayjs(d).format("YYYY-MM-DD");
  } catch {
    return null;
  }
}

function groupByDate(rows = []) {
  const map = {};
  for (const r of rows) {
    const k = keyFromTs(r.scheduledAt);
    if (!k) continue;
    if (!map[k]) map[k] = [];
    map[k].push(r);
  }
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
}

function isPastTs(ts) {
  try {
    const d = ts?.toDate?.();
    return d ? dayjs(d).isBefore(dayjs()) : false;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------

export default function MisReservas() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // cache tid -> nombre técnico
  const [techNames, setTechNames] = useState({});
  const loadingTidsRef = useRef(new Set());

  useEffect(() => {
    if (!uid) return;

    // Lee la colección "reservas" del cliente y ordena por fecha/hora
    const q = query(
      collection(db, "reservas"),
      where("clientId", "==", uid),
      orderBy("scheduledAt", "asc")
    );

    const unsub = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(rows);
      setLoading(false);

      // precarga nombres de técnicos que no tengamos (si no viene en el doc)
      const missing = rows
        .map(r => r.technicianId)
        .filter(Boolean)
        .filter(tid => !techNames[tid] && !loadingTidsRef.current.has(tid));

      if (missing.length) missing.forEach(loadTechName);
    }, e => {
      console.error(e);
      
      setErr(e?.message || "Error al cargar");
      setLoading(false);
    });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  async function loadTechName(tid) {
    try {
      loadingTidsRef.current.add(tid);
      const snap = await getDoc(doc(db, "technicians", tid));
      const nombre = snap.exists() ? (snap.data()?.nombre || tid) : tid;
      setTechNames(prev => ({ ...prev, [tid]: nombre }));
    } catch {
      setTechNames(prev => ({ ...prev, [tid]: tid }));
    } finally {
      loadingTidsRef.current.delete(tid);
    }
  }

  // separa próximas e historial comparando scheduledAt con ahora
  const upcoming = useMemo(
    () => items.filter(r => !isPastTs(r.scheduledAt) && r.status !== "cancelada"),
    [items]
  );
  const past = useMemo(
    () => items.filter(r => isPastTs(r.scheduledAt) || r.status === "cancelada"),
    [items]
  );

  const gUpcoming = useMemo(() => groupByDate(upcoming), [upcoming]);
  const gPast = useMemo(() => groupByDate(past), [past]);

  if (!uid) return <p className="p-6">Debes iniciar sesión.</p>;
  if (loading) return <p className="p-6">Cargando tus reservas…</p>;
  if (err) return <p className="p-6 text-red-600">{err}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mis reservas</h1>
          <p className="text-sm text-gray-600 mt-1">Revisa tus próximas reservas y el historial. Pulsa una reserva para ver más detalles.</p>
        </div>

        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg bg-white border shadow-sm text-sm text-center">
            <div className="text-xs text-gray-500">Próximas</div>
            <div className="font-semibold text-gray-900">{upcoming.length}</div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white border shadow-sm text-sm text-center">
            <div className="text-xs text-gray-500">Historial</div>
            <div className="font-semibold text-gray-900">{past.length}</div>
          </div>
        </div>
      </header>

      {/* Próximas */}
      <Section title="Próximas" groups={gUpcoming} techNames={techNames} emptyText="No tienes reservas próximas." />

      {/* Historial */}
      <Section title="Historial" groups={gPast} techNames={techNames} emptyText="Aún no tienes historial." />
    </div>
  );
}

// helper: obtener iniciales (para avatar)
function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// helper: extrae dígitos para enlaces tel/wa
function phoneDigits(raw = "") {
  return String(raw || "").replace(/\D/g, "");
}

function Section({ title, groups, techNames, emptyText }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>

      {groups.length === 0 && <p className="text-gray-600">{emptyText}</p>}

      {groups.map(([fecha, rows]) => (
        <div key={fecha} className="mb-6">
          <h3 className="text-lg font-medium mb-2">{dayjs(fecha).format("dddd, DD MMM YYYY")}</h3>

          <ul className="space-y-3">
            {rows.map(r => {
              const labelTec = r.technicianName || techNames[r.technicianId] || r.technicianId;
              const whenStr = fmtDateTime(r.scheduledAt);
              const shortTime = dayjs(r.scheduledAt?.toDate?.()).format("HH:mm");
              const status = humanStatus(r.status);
              const phone = phoneDigits(r.technicianPhone || r.technicianTelefono || "");

              return (
                <li key={r.id} className="bg-white rounded-lg border p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition">
                  {/* avatar + hora */}
                  <div className="w-24 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center justify-center text-lg">
                      {getInitials(labelTec)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{shortTime}</div>
                  </div>

                  {/* detalles */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{labelTec}</div>
                        <div className="text-sm text-gray-500 mt-1">{whenStr}</div>
                      </div>

                      <div className="ml-4">
                        <StatusBadge status={status.badge} />
                      </div>
                    </div>

                    {r.description && <div className="text-sm text-gray-600 mt-3">Nota: {r.description}</div>}
                    {r.address && <div className="text-xs text-gray-400 mt-2">{r.address}</div>}
                  </div>

                  {/* acciones */}
                  <div className="flex flex-col items-end gap-2">
                    {phone ? (
                      <a
                        href={`https://wa.me/${phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border text-sm"
                        title="Contactar por WhatsApp"
                      >
                        <Phone className="w-4 h-4" /> WhatsApp
                      </a>
                    ) : (
                      <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm text-gray-500" disabled>
                        <XCircle className="w-4 h-4" /> Sin contacto
                      </button>
                    )}

                    <button
                      type="button"
                      className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
                      onClick={() => { /* puedes abrir modal/detalle aquí */ }}
                    >
                      Ver detalle
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

// StatusBadge (ligero ajuste visual con icono)
function StatusBadge({ status }) {
  const map = {
    confirmed: { cls: "bg-emerald-100 text-emerald-800", icon: "✓", label: "Confirmada" },
    cancelled: { cls: "bg-rose-100 text-rose-800", icon: "✕", label: "Cancelada" },
    done: { cls: "bg-sky-100 text-sky-800", icon: "✔", label: "Completada" },
    pending: { cls: "bg-gray-100 text-gray-700", icon: "…", label: "Solicitada" },
  };
  const meta = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-wide px-2 py-1 rounded ${meta.cls}`}>
      <span className="text-[11px] font-medium">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

function fmtDateTime(ts) {
  try {
    const d = ts?.toDate?.();
    return d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—";
  } catch {
    return "—";
  }
}

function humanStatus(raw) {
  const v = (raw || "").toLowerCase();
  if (v === "solicitada") return { badge: "pending", label: "Solicitada" };
  if (v === "confirmada" || v === "confirmed") return { badge: "confirmed", label: "Confirmada" };
  if (v === "cancelada" || v === "cancelled") return { badge: "cancelled", label: "Cancelada" };
  if (v === "completada" || v === "completed") return { badge: "done", label: "Completada" };
  return { badge: "pending", label: v || "Solicitada" };
}
