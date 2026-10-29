// src/Components/TechnicianPaymentsTab.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, AlertCircle, Check, X } from "lucide-react";
import {
  subscribeTechnicianPayments,
  summarizeTechnicianPayments,
  confirmPayment,
  rejectPayment,
  formatAmount,
} from "../services/payments";
import { paymentStatusMeta, PAYMENT_METHOD_LABEL } from "../utils/paymentStatus";
import dayjs from "dayjs";

export default function TechnicianPaymentsTab({ technicianId }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!technicianId) return;

    setLoading(true);
    const unsub = subscribeTechnicianPayments(
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

    return unsub;
  }, [technicianId]);

  const summary = useMemo(() => summarizeTechnicianPayments(payments), [payments]);

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

  if (loading) {
    return <p className="text-center py-12">Cargando pagos...</p>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-sm">{error}</div>
      )}
      {/* Resumen de Ganancias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Ganado",
            value: formatAmount(summary.totalEarned),
            color: "from-emerald-500 to-teal-500",
            icon: TrendingUp,
          },
          {
            label: "Pendiente",
            value: formatAmount(summary.totalPending),
            color: "from-yellow-500 to-orange-500",
            icon: Clock,
          },
          {
            label: "Reembolsado",
            value: formatAmount(summary.totalRefunded),
            color: "from-blue-500 to-cyan-500",
            icon: AlertCircle,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-2">{stat.label}</p>
                  <p
                    className="text-3xl font-black"
                    style={{ fontFamily: "Space Grotesk" }}
                  >
                    {stat.value}
                  </p>
                </div>
                <Icon className="w-8 h-8 opacity-40" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Historial de Pagos Recibidos
          </h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No tienes pagos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((payment, i) => {
              const status = paymentStatusMeta(payment.status);
              const canReview = payment.status === "reported" || payment.status === "pending";

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Pago por Reserva #{payment.bookingId?.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Cliente: {payment.clientName || `${payment.clientId?.slice(0, 12)}…`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {dayjs(payment.createdAt?.toDate?.()).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </div>
                    </div>

                    {/* Método de Pago */}
                    {payment.method && (
                      <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {PAYMENT_METHOD_LABEL[payment.method] || payment.method}
                      </div>
                    )}

                    {/* Monto */}
                    <div className="text-right">
                      <div
                        className="text-2xl font-black text-gray-900"
                        style={{ fontFamily: "Space Grotesk" }}
                      >
                        +{formatAmount(payment.amount)}
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`${status.badge} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap`}
                    >
                      {status.icon} {status.short}
                    </span>
                  </div>

                  {canReview && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handle("confirm", payment)}
                        disabled={busyId === payment.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Confirmar pago recibido
                      </button>
                      {payment.status === "reported" && (
                        <button
                          onClick={() => handle("reject", payment)}
                          disabled={busyId === payment.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> No lo recibí
                        </button>
                      )}
                    </div>
                  )}

                  {payment.notes && (
                    <div className="mt-3 text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                      <span className="whitespace-pre-line">{payment.notes}</span>
                      {payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-2 text-emerald-700 font-semibold underline"
                        >
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
