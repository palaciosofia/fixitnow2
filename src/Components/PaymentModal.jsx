// src/Components/PaymentModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { markPaymentAsPaidByClient, formatAmount, uploadCashProof } from "../services/payments";

export default function PaymentModal({ isOpen, onClose, payment, onPaymentSuccess }) {
  const [step, setStep] = useState("method"); // "method" | "paypal" | "transfer" | "cash"
  const [editAmount, setEditAmount] = useState(payment?.amount?.toString() || "0");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Para transferencia bancaria
  const [bankData, setBankData] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    accountType: "Ahorros", // Ahorros o Corriente
  });

  // Para efectivo
  const [cashProof, setCashProof] = useState(null);
  const [cashProofPreview, setCashProofPreview] = useState(null);

  const handleCashProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCashProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCashProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayPalRedirect = () => {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    // Crear URL de PayPal con parámetros
    const paypalBusinessId = "tu-paypal-business-id@example.com"; // Cambiar por el real
    const returnUrl = `${window.location.origin}/mis-reservas?payment_success=true`;
    const cancelUrl = `${window.location.origin}/mis-reservas?payment_cancelled=true`;

    const paypalUrl = new URL("https://www.paypal.com/cgi-bin/webscr");
    paypalUrl.searchParams.append("cmd", "_xclick");
    paypalUrl.searchParams.append("business", paypalBusinessId);
    paypalUrl.searchParams.append("item_name", `Pago FixItNow - ${payment.bookingId}`);
    paypalUrl.searchParams.append("amount", amount.toFixed(2));
    paypalUrl.searchParams.append("currency_code", "USD");
    paypalUrl.searchParams.append("return", returnUrl);
    paypalUrl.searchParams.append("cancel_return", cancelUrl);
    paypalUrl.searchParams.append("invoice", payment.id);

    // Guardar pago y redirigir a PayPal
    const notes_paypal = `PayPal URL: ${paypalUrl.toString()}`;
    handlePaymentSubmit("paypal", notes_paypal, paypalUrl.toString());
  };

  const handleBankTransferSubmit = async () => {
    if (!bankData.bankName.trim()) {
      setError("Por favor ingresa el nombre del banco");
      return;
    }
    if (!bankData.accountHolder.trim()) {
      setError("Por favor ingresa el nombre del titular");
      return;
    }
    if (!bankData.accountNumber.trim()) {
      setError("Por favor ingresa el número de cuenta");
      return;
    }

    const notes_bank = `Banco: ${bankData.bankName}\nTitular: ${bankData.accountHolder}\nCuenta: ${bankData.accountNumber}\nTipo: ${bankData.accountType}`;
    await handlePaymentSubmit("transfer", notes_bank);
  };

  const handleCashSubmit = async () => {
    if (!cashProof) {
      setError("Por favor sube una foto como comprobante");
      return;
    }

    setLoading(true);
    try {
      // Subir foto a Firebase Storage
      const photoUrl = await uploadCashProof(payment.id, cashProof);
      const notes_cash = `Efectivo - Comprobante: ${photoUrl}\nMonto: ${editAmount}`;
      await handlePaymentSubmit("cash", notes_cash);
    } catch (err) {
      setError("Error al subir la foto: " + err.message);
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (method, extraNotes = "", paypalUrl = null) => {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const finalNotes = extraNotes ? `${extraNotes}\n${notes}`.trim() : notes;

      await markPaymentAsPaidByClient(payment.id, {
        amount,
        method,
        notes: finalNotes,
      });

      // Si es PayPal, redirigir a la URL después de guardar
      if (method === "paypal" && paypalUrl) {
        setTimeout(() => {
          window.location.href = paypalUrl;
        }, 1000);
        return;
      }

      setSuccess(true);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        onPaymentSuccess?.();
        setSuccess(false);
        setStep("method");
        setSelectedMethod(null);
        setEditAmount(payment?.amount?.toString() || "0");
        setNotes("");
        setBankData({
          bankName: "",
          accountHolder: "",
          accountNumber: "",
          accountType: "Ahorros",
        });
        setCashProof(null);
        setCashProofPreview(null);
      }, 2000);
    } catch (err) {
      console.error("Error en pago:", err);
      setError(err.message || "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex items-center justify-between">
                  <h2 className="text-2xl font-black" style={{ fontFamily: "Space Grotesk" }}>
                    Procesar Pago
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {success ? (
                  // Success State
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "Space Grotesk" }}>
                      ¡Pago Exitoso!
                    </h3>
                    <p className="text-gray-600">
                      Tu pago de ${parseFloat(editAmount).toLocaleString("es-CO")} ha sido registrado
                    </p>
                  </motion.div>
                ) : step === "method" ? (
                  // Step 1: Seleccionar método
                  <>
                    {/* Monto */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900">
                        Monto a pagar
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 focus:outline-none font-bold text-lg"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Monto sugerido: ${parseFloat(payment?.amount || 0).toLocaleString("es-CO")}
                      </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Selecciona método de pago:
                      </p>

                      {[
                        { id: "paypal", label: "🅿️ PayPal", desc: "Pago en línea seguro" },
                        { id: "transfer", label: "🏦 Transferencia Bancaria", desc: "Débito directo" },
                        { id: "cash", label: "💵 Efectivo", desc: "Pago en persona" },
                      ].map((method) => (
                        <motion.button
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedMethod(method.id);
                            setStep(method.id);
                          }}
                          className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                            selectedMethod === method.id
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-gray-200 hover:border-emerald-300 bg-white"
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{method.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{method.desc}</div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    {/* CTA Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : step === "paypal" ? (
                  // Step 2: PayPal
                  <>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">🅿️</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Pago por PayPal</h3>
                      <p className="text-sm text-gray-600">
                        Serás redirigido a PayPal para completar el pago de
                      </p>
                      <div className="bg-emerald-50 p-4 rounded-2xl">
                        <p className="text-2xl font-bold text-emerald-600">
                          ${parseFloat(editAmount).toLocaleString("es-CO")}
                        </p>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                          Notas (opcional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej: Pago por servicio..."
                          className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm resize-none"
                          rows="2"
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setStep("method")}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        Atrás
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePayPalRedirect}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? "Procesando..." : "Ir a PayPal"}
                      </motion.button>
                    </div>
                  </>
                ) : step === "transfer" ? (
                  // Step 3: Transferencia Bancaria
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">Datos de Transferencia</h3>

                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                        <p className="text-sm text-amber-800">
                          <strong>Monto a transferir:</strong> ${parseFloat(editAmount).toLocaleString("es-CO")}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-900">Banco</label>
                          <input
                            type="text"
                            placeholder="Ej: Bancolombia, BBVA, etc."
                            value={bankData.bankName}
                            onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-900">Titular de la Cuenta</label>
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            value={bankData.accountHolder}
                            onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-900">Número de Cuenta</label>
                          <input
                            type="text"
                            placeholder="Ej: 123456789"
                            value={bankData.accountNumber}
                            onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-900">Tipo de Cuenta</label>
                          <select
                            value={bankData.accountType}
                            onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm"
                          >
                            <option>Ahorros</option>
                            <option>Corriente</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                          Notas adicionales (opcional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej: Referencia del pago..."
                          className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm resize-none"
                          rows="2"
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setStep("method")}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        Atrás
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBankTransferSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {loading ? "Registrando..." : "Confirmar"}
                      </motion.button>
                    </div>
                  </>
                ) : step === "cash" ? (
                  // Step 4: Efectivo
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">Pago en Efectivo</h3>

                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                        <p className="text-sm text-green-800 mb-2">Monto a Pagar</p>
                        <p className="text-3xl font-black text-green-600">
                          ${parseFloat(editAmount).toLocaleString("es-CO")}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                        <p className="text-sm text-blue-800">
                          Por favor sube una foto o comprobante de tu pago
                        </p>
                      </div>

                      {/* Upload Proof */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                          Comprobante/Foto del pago
                        </label>
                        <label className="flex flex-col items-center justify-center w-full p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-700 font-semibold">
                              {cashProof ? "✓ Foto cargada" : "Haz clic para subir"}
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCashProofUpload}
                            className="hidden"
                          />
                        </label>

                        {cashProofPreview && (
                          <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                            <img src={cashProofPreview} alt="Comprobante" className="w-full h-32 object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                          Notas (opcional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej: Pago realizado el..."
                          className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm resize-none"
                          rows="2"
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setStep("method")}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                      >
                        Atrás
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCashSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {loading ? "Registrando..." : "Confirmar"}
                      </motion.button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
