// src/Components/TechnicianPaymentsTab.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  subscribeTechnicianPayments,
  getTechnicianPaymentsSummary,
  formatAmount,
} from "../services/payments";
import dayjs from "dayjs";

export default function TechnicianPaymentsTab({ technicianId }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPending: 0,
    totalRefunded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!technicianId) return;

    setLoading(true);
    const unsub = subscribeTechnicianPayments(technicianId, async (data) => {
      setPayments(data);

      // Obtener resumen
      const sum = await getTechnicianPaymentsSummary(technicianId);
      setSummary(sum);
      setLoading(false);
    });

    return unsub;
  }, [technicianId]);

  if (loading) {
    return <p className="text-center py-12">Cargando pagos...</p>;
  }

  return (
    <div className="space-y-8">
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
              const statusMap = {
                pending: { color: "yellow", label: "Pendiente", icon: "⏳" },
                paid: { color: "emerald", label: "Pagado", icon: "✓" },
                failed: { color: "red", label: "Fallido", icon: "✕" },
                refunded: { color: "blue", label: "Reembolsado", icon: "↶" },
              };
              const status = statusMap[payment.status] || statusMap.pending;

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
                        Cliente: {payment.clientId?.slice(0, 12)}...
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
                        {payment.method === "card"
                          ? "💳 Tarjeta"
                          : payment.method === "transfer"
                          ? "🏦 Transferencia"
                          : "💵 Efectivo"}
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
                      className={`bg-${status.color}-100 text-${status.color}-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap`}
                    >
                      {status.icon} {status.label}
                    </span>
                  </div>

                  {payment.notes && (
                    <div className="mt-3 text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                      {payment.notes}
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
