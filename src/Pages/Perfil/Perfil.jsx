// src/Pages/Perfil/Perfil.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import { motion } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
} from "lucide-react";
import {
  subscribeClientPayments,
  getClientPaymentsSummary,
  formatAmount,
  getPaymentStatusLabel,
} from "../../services/payments";
import { getClientReviews } from "../../services/reviews";
import PaymentModal from "../../Components/PaymentModal";
import dayjs from "dayjs";

export default function Perfil() {
  const { user, isCliente } = useAuth();
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargar pagos del cliente
  useEffect(() => {
    if (!user?.uid || !isCliente) return;

    setLoading(true);
    const unsub = subscribeClientPayments(user.uid, async (data) => {
      setPayments(data);

      // Obtener resumen
      const sum = await getClientPaymentsSummary(user.uid);
      setSummary(sum);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid, isCliente]);

  // Cargar reseñas del cliente
  useEffect(() => {
    if (!user?.uid || !isCliente) return;

    const loadReviews = async () => {
      try {
        const clientReviews = await getClientReviews(user.uid);
        setReviews(clientReviews);
      } catch (error) {
        console.error("Error cargando reseñas:", error);
      }
    };

    loadReviews();
  }, [user?.uid, isCliente]);

  if (!user) return <p className="p-6">Debes iniciar sesión.</p>;
  if (!isCliente)
    return <p className="p-6">Esta sección es solo para clientes.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-black text-gray-900 mb-2"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Mi Perfil
          </h1>
          <p className="text-gray-600">Gestiona tu cuenta y pagos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { id: "payments", label: "💳 Pagos", icon: CreditCard },
            { id: "reviews", label: "⭐ Mis Reseñas", icon: Star },
            { id: "profile", label: "👤 Perfil", icon: "user" },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
              style={{ fontFamily: "Space Grotesk" }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "payments" && (
          <PaymentsTab
            payments={payments}
            summary={summary}
            loading={loading}
            onPaymentClick={(payment) => {
              setSelectedPayment(payment);
              setShowPaymentModal(true);
            }}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab reviews={reviews} />
        )}

        {activeTab === "profile" && <ProfileTab user={user} />}
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
          onPaymentSuccess={() => {
            // Los pagos se actualizan automáticamente via subscription
          }}
        />
      )}
    </div>
  );
}

// Pestaña de Pagos
function PaymentsTab({ payments, summary, loading, onPaymentClick }) {
  if (loading) {
    return <p className="text-center py-12">Cargando pagos...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Adeudado",
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
                  <p className="text-3xl font-black" style={{ fontFamily: "Space Grotesk" }}>
                    {stat.value}
                  </p>
                </div>
                <Icon className="w-8 h-8 opacity-40" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lista de Pagos */}
      <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Space Grotesk" }}>
            Historial de Pagos
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
              const canPay = payment.status === "pending";

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
                        Reserva #{payment.bookingId?.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {dayjs(payment.createdAt?.toDate?.()).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "Space Grotesk" }}>
                        {formatAmount(payment.amount)}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`bg-${status.color}-100 text-${status.color}-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2`}
                      >
                        {status.icon} {status.label}
                      </span>

                      {/* Action Button */}
                      {canPay && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onPaymentClick(payment)}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Pagar
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Pestaña de Perfil
function ProfileTab({ user }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-8 max-w-2xl">
      <h2
        className="text-2xl font-black text-gray-900 mb-6"
        style={{ fontFamily: "Space Grotesk" }}
      >
        Información Personal
      </h2>

      <div className="space-y-6">
        {[
          { label: "Nombre", value: user?.displayName || "No especificado" },
          { label: "Email", value: user?.email || "No especificado" },
          { label: "UID", value: user?.uid || "N/A" },
        ].map((field, i) => (
          <div key={i} className="pb-4 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              {field.label}
            </label>
            <p className="text-gray-900">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pestaña de Reseñas del Cliente
function ReviewsTab({ reviews }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Space Grotesk" }}>
          Mis Reseñas
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {reviews.length} reseña{reviews.length !== 1 ? "s" : ""} realizada{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No has dejado reseñas todavía.</p>
          <p className="text-sm text-gray-500 mt-2">Después de cada servicio podrás dejar una reseña al técnico.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{review.technicianName || "Técnico"}</h3>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`w-4 h-4 ${
                            j < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <p className="text-xs text-gray-500">
                    {dayjs(review.createdAt?.toDate?.()).format("DD/MM/YYYY HH:mm")}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

