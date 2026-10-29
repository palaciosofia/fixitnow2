// src/Components/TechnicianPaymentsTab.jsx
// Pagos que recibe el técnico: resumen y confirmación de pagos reportados.
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Check, X, Wallet, ExternalLink } from "lucide-react";
import {
  subscribeTechnicianPayments,
  summarizeTechnicianPayments,
  confirmPayment,
  rejectPayment,
} from "../services/payments";
import { paymentStatusMeta, PAYMENT_METHOD_LABEL } from "../utils/paymentStatus";
import { formatCOP } from "../utils/money";
import { Alert, Avatar, Badge, Button, Card, EmptyState, Loader, Segmented } from "../ui";

export default function TechnicianPaymentsTab({ technicianId }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("revision");

  useEffect(() => {
    if (!technicianId) return;
    setLoading(true);
    return subscribeTechnicianPayments(
      technicianId,
      (data) => {
        setPayments(data);
        setLoading(false);
      },
      () => {
        setError("No pudimos cargar tus pagos.");
        setLoading(false);
      }
    );
  }, [technicianId]);

  const summary = useMemo(() => summarizeTechnicianPayments(payments), [payments]);
  const visibles = useMemo(() => {
    const list = payments.filter((p) => p.status !== "cancelled");
    if (filter === "revision") return list.filter((p) => p.status === "reported" || p.status === "pending");
    if (filter === "pagados") return list.filter((p) => p.status === "paid");
    return list;
  }, [payments, filter]);
  const reportedCount = payments.filter((p) => p.status === "reported").length;

  async function handle(action, payment) {
    setBusyId(payment.id);
    setError("");
    try {
      if (action === "confirm") await confirmPayment(payment.id);
      else await rejectPayment(payment.id, "no se recibió el pago");
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo actualizar el pago.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loader label="Cargando pagos…" />;

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger" onClose={() => setError("")}>{error}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Recibido" value={formatCOP(summary.totalEarned)} tone="text-ok" />
        <Stat label="Por cobrar o en revisión" value={formatCOP(summary.totalPending)} />
        <Stat label="Pagos por confirmar" value={reportedCount} tone={reportedCount ? "text-warn" : "text-ink"} />
      </div>

      <Segmented
        label="Filtrar pagos"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "revision", label: "Pendientes" },
          { value: "pagados", label: "Pagados" },
          { value: "todos", label: "Todos" },
        ]}
      />

      {visibles.length === 0 ? (
        <EmptyState icon={Wallet} title="No hay pagos aquí" text="Cuando un cliente reporte un pago, lo verás en Pendientes para confirmarlo." />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {visibles.map((p) => {
              const meta = paymentStatusMeta(p.status);
              const fecha = p.reportedAt?.toDate?.() || p.createdAt?.toDate?.();
              const canReview = p.status === "reported" || p.status === "pending";
              return (
                <li key={p.id} className="border-t border-[#F0F0F3] px-4 py-4 first:border-t-0 sm:px-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={p.clientName || "Cliente"} size={36} />
                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm font-semibold">{p.clientName || "Cliente"}</p>
                      <p className="text-xs text-subtle">
                        {[fecha ? dayjs(fecha).format("D MMM, h:mm a") : null, p.method ? PAYMENT_METHOD_LABEL[p.method] || p.method : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-base font-bold">{Number(p.amount) > 0 ? formatCOP(p.amount) : "A convenir"}</span>
                    <Badge tone={meta.tone}>{meta.short}</Badge>
                  </div>

                  {(p.notes || p.proofUrl) && (
                    <div className="mt-3 rounded-xl bg-canvas px-3.5 py-2.5 text-[13px] text-muted">
                      {p.notes && <p className="whitespace-pre-line">{p.notes}</p>}
                      {p.proofUrl && (
                        <a href={p.proofUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 font-medium text-brand-ink hover:underline">
                          Ver comprobante <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}

                  {canReview && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="success" onClick={() => handle("confirm", p)} loading={busyId === p.id}>
                        <Check className="h-4 w-4" aria-hidden="true" /> {p.status === "reported" ? "Confirmar pago recibido" : "Marcar como pagado"}
                      </Button>
                      {p.status === "reported" && (
                        <Button size="sm" variant="danger" onClick={() => handle("reject", p)} disabled={busyId === p.id}>
                          <X className="h-4 w-4" aria-hidden="true" /> No lo recibí
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
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
