// src/Components/ClientPayments.jsx
// Resumen y lista de pagos del cliente, con el botón para reportar un pago.
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Wallet, Receipt } from "lucide-react";
import { subscribeClientPayments, summarizeClientPayments } from "../services/payments";
import { paymentStatusMeta, PAYMENT_METHOD_LABEL } from "../utils/paymentStatus";
import { formatCOP } from "../utils/money";
import PaymentModal from "./PaymentModal";
import { Alert, Badge, Button, Card, EmptyState, Loader } from "../ui";

export default function ClientPayments({ uid, compact = false }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    return subscribeClientPayments(
      uid,
      (data) => {
        setPayments(data);
        setLoading(false);
      },
      () => {
        setError("No pudimos cargar tus pagos. Intenta de nuevo más tarde.");
        setLoading(false);
      }
    );
  }, [uid]);

  const summary = useMemo(() => summarizeClientPayments(payments), [payments]);
  const visibles = payments.filter((p) => p.status !== "cancelled");

  if (loading) return <Loader label="Cargando pagos…" className="min-h-[200px]" />;

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Por pagar o en revisión" value={formatCOP(summary.pending)} />
          <Stat label="Pagado" value={formatCOP(summary.paid)} tone="text-ok" />
          <Stat label="Total en reservas" value={formatCOP(summary.total)} />
        </div>
      )}

      {visibles.length === 0 ? (
        <EmptyState icon={Wallet} title="No tienes pagos registrados" text="Cuando hagas una reserva, su pago aparecerá aquí." action={<Button to="/tecnicos">Buscar técnico</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {visibles.map((p) => {
              const meta = paymentStatusMeta(p.status);
              const fecha = p.createdAt?.toDate?.();
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 border-t border-[#F0F0F3] px-4 py-4 first:border-t-0 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand-ink">
                    <Receipt className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-semibold">{p.technicianName ? `Servicio con ${p.technicianName}` : `Reserva ${p.bookingId?.slice(-11)}`}</p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {[fecha ? dayjs(fecha).format("D MMM YYYY") : null, p.method ? PAYMENT_METHOD_LABEL[p.method] || p.method : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-base font-bold">{Number(p.amount) > 0 ? formatCOP(p.amount) : "A convenir"}</span>
                  <Badge tone={meta.tone}>{meta.short}</Badge>
                  {p.status === "pending" && (
                    <Button size="sm" onClick={() => setSelected(p)}>Registrar pago</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!compact && visibles.length > 0 && (
        <p className="text-[13px] leading-relaxed text-muted">
          Cuando pagues, repórtalo aquí con el método que usaste. El pago queda “En revisión” hasta que el técnico confirme que lo recibió.
        </p>
      )}

      <PaymentModal isOpen={!!selected} payment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
