// src/Pages/Pagos/Pagos.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthProvider";
import { motion } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  subscribeClientPayments,
  summarizeClientPayments,
  formatAmount,
} from "../../services/payments";
import { paymentStatusMeta } from "../../utils/paymentStatus";
import PaymentModal from "../../Components/PaymentModal";
import dayjs from "dayjs";

export default function Pagos() {
  const { user, isCliente } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargar pagos del cliente
  useEffect(() => {
    if (!user?.uid || !isCliente) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeClientPayments(
      user.uid,
      (data) => {
        setPayments(data);
        setLoading(false);
      },
      () => {
        setLoadError("No pudimos cargar tus pagos. Intenta de nuevo más tarde.");
        setLoading(false);
      }
    );
    return unsub;
  }, [user?.uid, isCliente]);

  const summary = useMemo(() => summarizeClientPayments(payments), [payments]);

  if (!user) return <p className="p-6">Debes iniciar sesión.</p>;
  if (!isCliente) return <p className="p-6">Esta sección es solo para clientes.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div>
              <h1
                className="text-4xl md:text-5xl font-black text-gray-900"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Mis Pagos
              </h1>
              <p className="text-gray-600 mt-2">Reporta y revisa los pagos de tus reservas</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-600">Cargando pagos...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-red-100 text-red-700">
            {loadError}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-gray-100">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No tienes pagos registrados.</p>
            <p className="text-sm text-gray-500 mt-2">Cuando hagas una reserva, su pago aparecerá aquí.</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Total",
                  value: formatAmount(summary.total),
                  color: "from-blue-500 to-cyan-500",
                  icon: DollarSign,
                },
                {
                  label: "Pagado",
                  value: formatAmount(summary.paid),
                  color: "from-emerald-500 to-teal-500",
                  icon: CheckCircle,
                },
                {
                  label: "Pendiente",
                  value: formatAmount(summary.pending),
                  color: "from-yellow-500 to-orange-500",
                  icon: Clock,
                },
                {
                  label: "Fallido",
                  value: formatAmount(summary.failed),
                  color: "from-red-500 to-pink-500",
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h2
                  className="text-2xl font-black text-gray-900"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  Historial de Pagos
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {payments.length} pago{payments.length !== 1 ? "s" : ""} registrado
                  {payments.length !== 1 ? "s" : ""}
                </p>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No tienes pagos registrados.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payments.map((payment, i) => {
                    const status = paymentStatusMeta(payment.status);
                    const canPay = payment.status === "pending";

                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-6 ${status.hover} transition-colors border-l-4 ${status.border}`}
                      >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          {/* Información */}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              {payment.technicianName
                                ? `Servicio con ${payment.technicianName}`
                                : `Reserva #${payment.bookingId?.slice(0, 12)}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                              {dayjs(payment.createdAt?.toDate?.()).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </div>
                            {payment.notes && (
                              <div className="text-xs text-gray-600 mt-2 italic whitespace-pre-line">
                                {payment.notes}
                              </div>
                            )}
                          </div>

                          {/* Monto */}
                          <div className="text-right">
                            <div
                              className="text-3xl font-black text-gray-900"
                              style={{ fontFamily: "Space Grotesk" }}
                            >
                              {formatAmount(payment.amount)}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-3">
                            <span
                              className={`${status.badge} px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap`}
                            >
                              {status.icon} {status.short}
                            </span>

                            {/* Action Button */}
                            {canPay && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowPaymentModal(true);
                                }}
                                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all whitespace-nowrap"
                              >
                                Pagar Ahora
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Info adicional */}
            {payments.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900">Información importante</h3>
                    <p className="text-sm text-blue-700 mt-2">
                      Cuando pagues, repórtalo desde aquí con el método que usaste. El pago
                      queda "En revisión" hasta que el técnico confirme que lo recibió.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}

        />
      )}
    </div>
  );
}
