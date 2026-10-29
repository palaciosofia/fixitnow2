// src/Pages/Tecnico/Agenda.jsx
// Agenda del técnico: tablero semanal (o lista) con sus reservas y el detalle
// de la reserva elegida para aceptarla, cancelarla, marcarla pagada o completada.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, CalendarX2, MessageCircle, CalendarDays } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import useMyTechId from "../../hooks/useMyTechId";
import { markBookingPaid, cancelBookingAndPayment } from "../../services/payments";
import { paymentStatusMeta, bookingStatusMeta, normalizeBookingStatus } from "../../utils/paymentStatus";
import { formatCOP } from "../../utils/money";
import { Alert, Avatar, Badge, Button, Card, EmptyState, Loader, PageHeader, Segmented } from "../../ui";
import { cx } from "../../ui/cx";

const DIAS_KEYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

function toDate(ts) {
  try {
    return ts?.toDate?.() || null;
  } catch {
    return null;
  }
}
const isPast = (ts) => (toDate(ts)?.getTime() ?? 0) < Date.now();
const startsWithin = (ts, hours) => {
  const ms = toDate(ts)?.getTime() ?? 0;
  return ms > Date.now() && (ms - Date.now()) / 36e5 <= hours;
};

const BLOCK_STYLES = {
  solicitada: "bg-warn-soft border-[#FCD98B] text-ink",
  confirmada: "bg-ok-soft border-[#BFE3CB] text-ink",
  completada: "bg-[#F4F4F5] border-line text-muted",
  cancelada: "bg-bad-soft border-[#FECDCA] text-muted line-through",
};

export default function Agenda() {
  const { user } = useAuth();
  const { tid, loading: loadingTid } = useMyTechId(user?.uid);

  const [rows, setRows] = useState([]);
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState("semana");
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf("week"));
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Nombres de clientes que no vengan en la reserva
  const [clientNames, setClientNames] = useState({});
  const loadingUids = useRef(new Set());

  useEffect(() => {
    if (!tid) {
      if (!loadingTid) setLoading(false);
      return;
    }
    getDoc(doc(db, "technicians", tid)).then((s) => s.exists() && setTech(s.data())).catch(() => {});
    const q = query(collection(db, "reservas"), where("technicianId", "==", tid), orderBy("scheduledAt", "asc"));
    return onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr("No pudimos cargar tu agenda.");
        setLoading(false);
      }
    );
  }, [tid, loadingTid]);

  useEffect(() => {
    const missing = [...new Set(rows.filter((r) => !r.clientName).map((r) => r.clientId).filter(Boolean))].filter(
      (id) => !(id in clientNames) && !loadingUids.current.has(id)
    );
    missing.forEach(async (id) => {
      loadingUids.current.add(id);
      try {
        const snap = await getDoc(doc(db, "users", id));
        const d = snap.exists() ? snap.data() : {};
        setClientNames((p) => ({ ...p, [id]: d.name || d.nombre || d.displayName || null }));
      } catch {
        // Sin permiso para leer el perfil: se usa lo que traiga la reserva
        setClientNames((p) => ({ ...p, [id]: null }));
      } finally {
        loadingUids.current.delete(id);
      }
    });
  }, [rows, clientNames]);

  const clientLabel = (r) => r.clientName || clientNames[r.clientId] || r.clientEmail || "Cliente";

  // Rango de horas del tablero según el horario del técnico
  const hours = useMemo(() => {
    let min = 8;
    let max = 18;
    const h = tech?.horarios;
    if (h && typeof h === "object") {
      const franjas = Object.values(h).flat().filter((f) => f?.inicio && f?.fin);
      if (franjas.length) {
        min = Math.min(...franjas.map((f) => parseInt(f.inicio, 10)));
        max = Math.max(...franjas.map((f) => parseInt(f.fin, 10)));
      }
    }
    // Incluye horas de reservas fuera del horario actual
    rows.forEach((r) => {
      const d = toDate(r.scheduledAt);
      if (d) {
        min = Math.min(min, d.getHours());
        max = Math.max(max, d.getHours() + 1);
      }
    });
    return Array.from({ length: Math.max(1, max - min) }, (_, i) => min + i);
  }, [tech, rows]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day")), [weekStart]);
  const byCell = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const d = toDate(r.scheduledAt);
      if (!d) return;
      const key = `${dayjs(d).format("YYYY-MM-DD")}_${d.getHours()}`;
      (map[key] ||= []).push(r);
    });
    return map;
  }, [rows]);

  const upcoming = useMemo(() => rows.filter((r) => !isPast(r.scheduledAt) && normalizeBookingStatus(r.status) !== "cancelada"), [rows]);
  const pendientes = upcoming.filter((r) => normalizeBookingStatus(r.status) === "solicitada");
  const selected = rows.find((r) => r.id === selectedId) || pendientes[0] || upcoming[0] || null;

  const flash = (tone, text) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 4000);
  };

  async function act(fn, okText, errText) {
    setBusy(true);
    try {
      await fn();
      flash("success", okText);
    } catch (e) {
      console.error(e);
      flash("danger", errText);
    } finally {
      setBusy(false);
    }
  }

  const accept = (b) => act(() => updateDoc(doc(db, "reservas", b.id), { status: "confirmada" }), "Reserva confirmada.", "No se pudo aceptar la reserva.");
  const complete = (b) => act(() => updateDoc(doc(db, "reservas", b.id), { status: "completada" }), "Marcaste el trabajo como completado.", "No se pudo actualizar la reserva.");
  const markPaid = (b) => act(() => markBookingPaid(b), "Marcaste la reserva como pagada.", "No se pudo marcar como pagada.");
  const cancel = (b) => {
    if (isPast(b.scheduledAt)) return flash("danger", "No puedes cancelar una reserva pasada.");
    const question = startsWithin(b.scheduledAt, 2)
      ? "La reserva inicia en menos de 2 horas. ¿Seguro que quieres cancelarla?"
      : "¿Cancelar esta reserva? El cliente verá que se canceló.";
    if (!window.confirm(question)) return;
    setSelectedId(null);
    // Borra la reserva (libera la franja) y deja el pago como "cancelado".
    act(() => cancelBookingAndPayment(b), "Reserva cancelada.", "No se pudo cancelar. Intenta de nuevo.");
  };

  if (loadingTid || loading) return <Loader label="Cargando tu agenda…" />;
  if (!tid) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Aún no tienes perfil de técnico"
        text="Complétalo para que los clientes puedan reservarte."
        action={<Button to="/mi-perfil">Completar mi perfil</Button>}
      />
    );
  }

  const today = dayjs();
  const weekLabel = `${days[0].format("D MMM")} – ${days[6].format("D MMM YYYY")}`;

  return (
    <div>
      <PageHeader
        title="Mi agenda"
        subtitle={pendientes.length ? `${pendientes.length} ${pendientes.length === 1 ? "solicitud" : "solicitudes"} por aceptar` : "Tus visitas de la semana"}
        actions={<Segmented label="Vista" value={view} onChange={setView} items={[{ value: "semana", label: "Semana" }, { value: "lista", label: "Lista" }]} />}
      />

      {notice && <Alert tone={notice.tone} className="mb-4" onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {err && <Alert tone="danger" className="mb-4">{err}</Alert>}

      <div className="flex flex-wrap items-start gap-4">
        <Card className="min-w-0 flex-[999_1_600px] p-4 sm:p-5">
          {view === "semana" ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setWeekStart(dayjs().startOf("week"))}>Hoy</Button>
                <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => setWeekStart((w) => w.subtract(1, "week"))}><ChevronLeft className="h-5 w-5" aria-hidden="true" /></Button>
                <Button variant="ghost" size="icon" aria-label="Semana siguiente" onClick={() => setWeekStart((w) => w.add(1, "week"))}><ChevronRight className="h-5 w-5" aria-hidden="true" /></Button>
                <span className="text-sm font-medium" aria-live="polite">{weekLabel}</span>
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[600px] border-l border-t border-line text-xs" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
                  <div className="border-b border-r border-line" />
                  {days.map((d) => {
                    const isToday = d.isSame(today, "day");
                    const off = tech?.horarios && !(tech.horarios[DIAS_KEYS[d.day()]] || []).length;
                    return (
                      <div key={d.format("YYYYMMDD")} className={cx("border-b border-r border-line p-2 text-center", off && "bg-[#FAFAFA]")}>
                        <p className={cx("text-[13px] font-semibold capitalize", isToday ? "text-brand-ink" : off && "text-subtle")}>{d.format("ddd").replace(".", "")}</p>
                        <p className={cx("mt-0.5", isToday ? "text-brand-ink" : "text-subtle")}>{d.format("D MMM").replace(".", "")}{isToday ? " · hoy" : ""}</p>
                      </div>
                    );
                  })}

                  {hours.map((h) => (
                    <HourRow
                      key={h}
                      h={h}
                      days={days}
                      tech={tech}
                      today={today}
                      byCell={byCell}
                      selectedId={selected?.id}
                      onSelect={setSelectedId}
                      clientLabel={clientLabel}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-muted">
                {[["Solicitada", "bg-warn-soft border-[#FCD98B]"], ["Confirmada", "bg-ok-soft border-[#BFE3CB]"], ["Completada", "bg-[#F4F4F5] border-line"]].map(([l, c]) => (
                  <span key={l} className="flex items-center gap-1.5"><span className={cx("h-3 w-3 rounded border", c)} />{l}</span>
                ))}
              </div>
            </>
          ) : (
            <ListView rows={rows} selectedId={selected?.id} onSelect={setSelectedId} clientLabel={clientLabel} />
          )}
        </Card>

        <aside className="flex w-full flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-24 lg:max-w-[340px]">
          {selected ? (
            <BookingDetail
              b={selected}
              clientName={clientLabel(selected)}
              busy={busy}
              onAccept={() => accept(selected)}
              onCancel={() => cancel(selected)}
              onPaid={() => markPaid(selected)}
              onComplete={() => complete(selected)}
            />
          ) : (
            <Card className="p-5">
              <p className="text-sm text-muted">No tienes reservas próximas. Cuando un cliente reserve, aparecerá aquí.</p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Tu horario</h2>
            <p className="mt-1 text-[13px] text-muted">Los clientes solo pueden reservar en las horas que definiste.</p>
            <Button variant="secondary" size="sm" className="mt-3" to="/mi-perfil">Editar horario</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function HourRow({ h, days, tech, today, byCell, selectedId, onSelect, clientLabel }) {
  return (
    <>
      <div className="border-b border-r border-line p-2 text-subtle">{`${String(h).padStart(2, "0")}:00`}</div>
      {days.map((d) => {
        const key = `${d.format("YYYY-MM-DD")}_${h}`;
        const items = byCell[key] || [];
        const off = tech?.horarios && !(tech.horarios[DIAS_KEYS[d.day()]] || []).length;
        return (
          <div key={key} className={cx("min-h-[64px] border-b border-r border-line p-1", off && "bg-[#FAFAFA]", d.isSame(today, "day") && "bg-[#F8F8FF]")}>
            {items.map((r) => {
              const st = normalizeBookingStatus(r.status);
              const active = r.id === selectedId;
              const t = toDate(r.scheduledAt);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r.id)}
                  aria-pressed={active}
                  className={cx(
                    "mb-1 w-full rounded-lg border p-1.5 text-left leading-snug",
                    BLOCK_STYLES[st],
                    active && "border-2 border-brand shadow-[0_6px_16px_rgba(91,76,240,0.18)]"
                  )}
                >
                  <span className="block font-semibold">{t ? dayjs(t).format("h:mm a") : ""}</span>
                  <span className="block truncate">{r.serviceName || r.description || "Visita"}</span>
                  <span className="block truncate opacity-80">{clientLabel(r)}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function ListView({ rows, selectedId, onSelect, clientLabel }) {
  const upcoming = rows.filter((r) => !isPast(r.scheduledAt));
  if (!upcoming.length) {
    return <EmptyState icon={CalendarDays} title="Sin reservas próximas" text="Cuando un cliente reserve, aparecerá aquí." className="border-0" />;
  }
  let lastDay = "";
  return (
    <ul className="flex flex-col gap-2">
      {upcoming.map((r) => {
        const t = toDate(r.scheduledAt);
        const day = t ? dayjs(t).format("YYYY-MM-DD") : "";
        const header = day !== lastDay;
        lastDay = day;
        const st = bookingStatusMeta(r.status);
        return (
          <li key={r.id}>
            {header && <p className="mb-1 mt-3 text-[13px] font-semibold first-letter:uppercase first:mt-0">{t ? dayjs(t).format("dddd D [de] MMMM") : ""}</p>}
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              aria-pressed={r.id === selectedId}
              className={cx("flex w-full items-center gap-3 rounded-xl border p-3 text-left", r.id === selectedId ? "border-brand bg-[#F7F6FF]" : "border-line hover:bg-canvas")}
            >
              <span className="w-16 text-sm font-semibold">{t ? dayjs(t).format("h:mm a") : ""}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.serviceName || r.description || "Visita"}</span>
                <span className="block truncate text-xs text-muted">{clientLabel(r)}</span>
              </span>
              <Badge tone={st.tone}>{st.label}</Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BookingDetail({ b, clientName, busy, onAccept, onCancel, onPaid, onComplete }) {
  const t = toDate(b.scheduledAt);
  const st = normalizeBookingStatus(b.status);
  const meta = bookingStatusMeta(b.status);
  const pay = paymentStatusMeta(b.paymentStatus || "pending");
  const past = isPast(b.scheduledAt);
  const paid = b.paymentStatus === "paid";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Reserva</h2>
        <Badge tone={meta.tone}>{st === "solicitada" ? "Por aceptar" : meta.label}</Badge>
      </div>
      <div className="mt-3.5 rounded-[14px] border border-line p-3.5">
        <p className="text-base font-semibold">{b.serviceName || "Visita técnica"}</p>
        <p className="mt-1 text-[13px] text-muted first-letter:uppercase">{t ? dayjs(t).format("dddd D [de] MMMM, h:mm a") : ""}</p>
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name={clientName} size={32} />
          <p className="text-[13px] font-medium">{clientName}</p>
        </div>
        {b.description && <p className="mt-3 text-[13px] leading-relaxed text-muted">“{b.description}”</p>}
      </div>
      <div className="mt-3.5 flex justify-between text-[13px]">
        <span className="text-muted">Pago</span>
        <span>
          <span className="font-semibold">{Number(b.amount) > 0 ? formatCOP(b.amount) : "A convenir"}</span> · <span>{pay.label}</span>
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {st === "solicitada" && !past && <Button onClick={onAccept} loading={busy}>Aceptar reserva</Button>}
        {st === "confirmada" && !paid && <Button variant="success" onClick={onPaid} disabled={busy}>Marcar como pagada</Button>}
        {st === "confirmada" && past && <Button variant="secondary" onClick={onComplete} disabled={busy}>Marcar trabajo completado</Button>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" to={`/chat/${b.clientId}/${encodeURIComponent(clientName)}`}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Escribir
          </Button>
          {!past && st !== "cancelada" ? (
            <Button variant="danger" onClick={onCancel} disabled={busy}>{st === "solicitada" ? "Rechazar" : "Cancelar"}</Button>
          ) : (
            <Link to="/mi-perfil?tab=pagos" className="flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold hover:bg-canvas">Ver pagos</Link>
          )}
        </div>
      </div>
    </Card>
  );
}
