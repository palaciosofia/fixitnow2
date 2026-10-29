// src/Pages/Cliente/MisReservas.jsx
// Reservas del cliente: próximas e historial, con estado de la reserva y del pago.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { CalendarPlus, CalendarX2, MessageCircle, Phone, Star } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { getOrCreatePaymentForBooking, subscribeClientPayments, summarizeClientPayments } from "../../services/payments";
import { paymentStatusMeta, bookingStatusMeta, normalizeBookingStatus } from "../../utils/paymentStatus";
import { formatCOP } from "../../utils/money";
import PaymentModal from "../../Components/PaymentModal";
import ReviewModal from "../../Components/ReviewModal";
import { Alert, Badge, Button, Card, CardTitle, EmptyState, Loader, PageHeader, Segmented } from "../../ui";
import { cx } from "../../ui/cx";

function toDate(ts) {
  try {
    return ts?.toDate?.() || null;
  } catch {
    return null;
  }
}
function isPast(ts) {
  const d = toDate(ts);
  return d ? d.getTime() < Date.now() : false;
}

export default function MisReservas() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const location = useLocation();
  const flashFromNav = location.state?.flash || "";
  const [flash, setFlash] = useState(flashFromNav);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("proximas");
  const [payments, setPayments] = useState([]);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payErr, setPayErr] = useState("");
  const [reviewTech, setReviewTech] = useState(null);

  // Nombres/teléfonos de técnicos que no vengan en la reserva
  const [techInfo, setTechInfo] = useState({});
  const loadingRef = useRef(new Set());

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "reservas"), where("clientId", "==", uid), orderBy("scheduledAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setErr("No pudimos cargar tus reservas.");
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return subscribeClientPayments(uid, setPayments);
  }, [uid]);

  useEffect(() => {
    const missing = [...new Set(items.map((r) => r.technicianId).filter(Boolean))].filter(
      (tid) => !(tid in techInfo) && !loadingRef.current.has(tid)
    );
    missing.forEach(async (tid) => {
      loadingRef.current.add(tid);
      try {
        const snap = await getDoc(doc(db, "technicians", tid));
        const d = snap.exists() ? snap.data() : {};
        setTechInfo((prev) => ({ ...prev, [tid]: { nombre: d.nombre, telefono: d.telefono, uid: d.uid, slug: d.slug } }));
      } catch {
        setTechInfo((prev) => ({ ...prev, [tid]: {} }));
      } finally {
        loadingRef.current.delete(tid);
      }
    });
  }, [items, techInfo]);

  const upcoming = useMemo(
    () => items.filter((r) => !isPast(r.scheduledAt) && normalizeBookingStatus(r.status) !== "cancelada"),
    [items]
  );
  const past = useMemo(
    () => items.filter((r) => isPast(r.scheduledAt) || normalizeBookingStatus(r.status) === "cancelada").reverse(),
    [items]
  );
  const summary = useMemo(() => summarizeClientPayments(payments), [payments]);
  const reviewable = useMemo(
    () => past.filter((r) => normalizeBookingStatus(r.status) !== "cancelada" && r.paymentStatus === "paid"),
    [past]
  );

  const handlePaymentClick = async (booking) => {
    setPayErr("");
    try {
      setSelectedPayment(await getOrCreatePaymentForBooking(booking));
    } catch (error) {
      console.error("Error obteniendo pago:", error);
      setPayErr("No pudimos cargar el pago de esta reserva. Intenta de nuevo en unos minutos.");
    }
  };

  if (loading) return <Loader label="Cargando tus reservas…" />;

  const list = tab === "proximas" ? upcoming : past;

  return (
    <div>
      <PageHeader
        title="Mis reservas"
        subtitle="Tus visitas próximas y el historial"
        actions={<Button to="/tecnicos"><CalendarPlus className="h-4 w-4" aria-hidden="true" /> Nueva reserva</Button>}
      />

      {flash && <Alert tone="success" className="mb-4" onClose={() => setFlash("")}>{flash}</Alert>}
      {payErr && <Alert tone="danger" className="mb-4" onClose={() => setPayErr("")}>{payErr}</Alert>}
      {err && <Alert tone="danger" className="mb-4">{err}</Alert>}

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_480px]">
          <Segmented
            label="Reservas"
            value={tab}
            onChange={setTab}
            items={[
              { value: "proximas", label: `Próximas · ${upcoming.length}` },
              { value: "historial", label: `Historial · ${past.length}` },
            ]}
          />

          {list.length === 0 ? (
            <EmptyState
              className="mt-3.5"
              icon={CalendarX2}
              title={tab === "proximas" ? "No tienes reservas próximas" : "Aún no tienes historial"}
              text={tab === "proximas" ? "Busca un técnico y reserva una hora en su agenda." : "Aquí verás tus visitas pasadas."}
              action={tab === "proximas" && <Button to="/tecnicos">Buscar técnico</Button>}
            />
          ) : (
            <ul className="mt-3.5 flex flex-col gap-3">
              {list.map((r) => (
                <BookingRow
                  key={r.id}
                  r={r}
                  tech={techInfo[r.technicianId] || {}}
                  onPay={() => handlePaymentClick(r)}
                  onReview={() => setReviewTech({ id: r.technicianId, nombre: r.technicianName || techInfo[r.technicianId]?.nombre })}
                />
              ))}
            </ul>
          )}
        </div>

        <aside className="flex w-full flex-[1_1_260px] flex-col gap-3 lg:max-w-[300px]">
          <Card className="p-5">
            <CardTitle className="mb-3">Resumen de pagos</CardTitle>
            <dl className="text-sm">
              <div className="flex justify-between border-t border-[#F0F0F3] py-2.5"><dt className="text-muted">Pendiente o en revisión</dt><dd className="font-semibold">{formatCOP(summary.pending)}</dd></div>
              <div className="flex justify-between border-t border-[#F0F0F3] py-2.5"><dt className="text-muted">Pagado</dt><dd className="font-semibold">{formatCOP(summary.paid)}</dd></div>
            </dl>
            <Link to="/pagos" className="mt-2 inline-block text-[13px] font-medium text-brand-ink hover:underline">Ver todos los pagos →</Link>
          </Card>
          {reviewable.length > 0 && (
            <div className="rounded-2xl bg-brand-tint p-5">
              <h2 className="text-[15px] font-semibold">¿Cómo te fue?</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3F3F46]">Deja una reseña: ayuda a otros vecinos a elegir bien.</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 border-0 text-brand-ink"
                onClick={() => setReviewTech({ id: reviewable[0].technicianId, nombre: reviewable[0].technicianName || techInfo[reviewable[0].technicianId]?.nombre })}
              >
                <Star className="h-4 w-4" aria-hidden="true" /> Calificar a {reviewable[0].technicianName || "tu técnico"}
              </Button>
            </div>
          )}
        </aside>
      </div>

      <PaymentModal isOpen={!!selectedPayment} payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      <ReviewModal
        isOpen={!!reviewTech}
        onClose={() => setReviewTech(null)}
        technician={reviewTech}
        userId={uid}
        userName={profile?.name || user?.displayName}
      />
    </div>
  );
}

function BookingRow({ r, tech, onPay, onReview }) {
  const d = toDate(r.scheduledAt);
  const status = bookingStatusMeta(r.status);
  const pay = paymentStatusMeta(r.paymentStatus);
  const nombre = r.technicianName || tech.nombre || "Técnico";
  const cancelada = normalizeBookingStatus(r.status) === "cancelada";
  const canPay = !cancelada && (!r.paymentStatus || r.paymentStatus === "pending");
  const canReview = !cancelada && isPast(r.scheduledAt) && r.paymentStatus === "paid";
  const phone = String(tech.telefono || "").replace(/\D/g, "");
  const chatUid = tech.uid || r.technicianId;
  const isToday = d && dayjs(d).isSame(dayjs(), "day");

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
      <div className={cx("w-16 shrink-0 rounded-xl py-2 text-center", isToday ? "bg-brand-soft text-brand-ink" : "bg-[#F4F4F5]")}>
        <p className="text-xs uppercase">{d ? dayjs(d).format("ddd").replace(".", "") : "—"}</p>
        <p className="text-[22px] font-bold leading-tight">{d ? dayjs(d).format("D") : ""}</p>
        <p className="text-[11px]">{d ? dayjs(d).format("MMM").replace(".", "") : ""}</p>
      </div>
      <div className="min-w-[200px] flex-1">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {!cancelada && <Badge tone={pay.tone}>{pay.label}</Badge>}
        </div>
        <h3 className="text-base font-semibold">{r.serviceName || r.description?.slice(0, 60) || "Visita técnica"}</h3>
        <p className="mt-1 text-[13px] text-muted">
          {[d ? dayjs(d).format("h:mm a") : null, nombre, Number(r.amount) > 0 ? formatCOP(r.amount) : null].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canPay && <Button size="sm" onClick={onPay}>Registrar pago</Button>}
        {canReview && <Button size="sm" variant="soft" onClick={onReview}><Star className="h-4 w-4" aria-hidden="true" /> Calificar</Button>}
        {!cancelada && (
          <Button size="sm" variant="secondary" to={`/chat/${chatUid}/${encodeURIComponent(nombre)}`}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Mensaje
          </Button>
        )}
        {phone && !cancelada && (
          <Button size="sm" variant="secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
            <Phone className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </Button>
        )}
        {(r.technicianSlug || tech.slug) && (
          <Button size="sm" variant="ghost" to={`/tecnicos/${r.technicianSlug || tech.slug}`}>Ver técnico</Button>
        )}
      </div>
    </li>
  );
}
