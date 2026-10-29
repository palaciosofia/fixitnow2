// src/Components/PaymentModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { reportPaymentByClient, uploadPaymentProof, formatAmount } from "../services/payments";

// PayPal solo aparece si está configurado en el .env.
// PayPal no acepta COP, así que se convierte a USD con la tasa configurada.
const PAYPAL_BUSINESS_ID = import.meta.env.VITE_PAYPAL_BUSINESS_ID || "";
const COP_PER_USD = Number(import.meta.env.VITE_COP_PER_USD) || 0;
const PAYPAL_ENABLED = Boolean(PAYPAL_BUSINESS_ID && COP_PER_USD > 0);

const METHODS = [
  PAYPAL_ENABLED && { id: "paypal", label: "🅿️ PayPal", desc: "Pago en línea (se cobra en USD)" },
  { id: "transfer", label: "🏦 Transferencia bancaria", desc: "Reporta la transferencia que ya hiciste" },
  { id: "cash", label: "💵 Efectivo", desc: "Pago en persona, con foto del comprobante" },
].filter(Boolean);

const EMPTY_TRANSFER = { bankName: "", accountHolder: "", reference: "" };

export default function PaymentModal({ isOpen, onClose, payment, onPaymentSuccess }) {
  const [step, setStep] = useState("method"); // "method" | "paypal" | "transfer" | "cash"
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // El monto lo fija la reserva; el cliente no lo puede cambiar.
  const amount = Number(payment?.amount) || 0;
  const amountLabel = amount > 0 ? formatAmount(amount) : "A convenir con el técnico";
  const usdAmount = PAYPAL_ENABLED && amount > 0 ? amount / COP_PER_USD : 0;

  // Transferencia: datos para que el técnico la identifique
  const [bankData, setBankData] = useState(EMPTY_TRANSFER);

  // Efectivo: foto del comprobante
  const [cashProof, setCashProof] = useState(null);
  const [cashProofPreview, setCashProofPreview] = useState(null);

  const resetState = () => {
    setSuccess(false);
    setStep("method");
    setSelectedMethod(null);
    setNotes("");
    setError("");
    setBankData(EMPTY_TRANSFER);
    setCashProof(null);
    setCashProofPreview(null);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleCashProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCashProof(file);
    const reader = new FileReader();
    reader.onloadend = () => setCashProofPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submitReport = async (method, extraNotes = "", proofUrl = null) => {
    const finalNotes = [extraNotes, notes].filter(Boolean).join("\n").trim();
    await reportPaymentByClient(payment.id, { method, notes: finalNotes, proofUrl });
  };

  const run = async (fn) => {
    setLoading(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      console.error("Error en pago:", err);
      setError(err?.message || "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const finishSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onPaymentSuccess?.();
      handleClose();
    }, 2000);
  };

  const handlePayPalRedirect = () =>
    run(async () => {
      if (!usdAmount) throw new Error("Esta reserva no tiene un monto definido para pagar en línea.");

      const paypalUrl = new URL("https://www.paypal.com/cgi-bin/webscr");
      paypalUrl.searchParams.append("cmd", "_xclick");
      paypalUrl.searchParams.append("business", PAYPAL_BUSINESS_ID);
      paypalUrl.searchParams.append("item_name", `Pago FixItNow - Reserva ${payment.bookingId}`);
      paypalUrl.searchParams.append("amount", usdAmount.toFixed(2));
      paypalUrl.searchParams.append("currency_code", "USD");
      paypalUrl.searchParams.append("return", `${window.location.origin}/mis-reservas?payment_success=true`);
      paypalUrl.searchParams.append("cancel_return", `${window.location.origin}/mis-reservas?payment_cancelled=true`);
      paypalUrl.searchParams.append("invoice", payment.id);

      await submitReport("paypal", `PayPal: USD ${usdAmount.toFixed(2)} (${formatAmount(amount)})`);
      window.location.href = paypalUrl.toString();
    });

  const handleBankTransferSubmit = () =>
    run(async () => {
      if (!bankData.bankName.trim()) throw new Error("Ingresa el banco desde el que transferiste");
      if (!bankData.accountHolder.trim()) throw new Error("Ingresa el nombre del titular");
      if (!bankData.reference.trim()) throw new Error("Ingresa el número de referencia o comprobante");

      const notesBank = `Banco: ${bankData.bankName}\nTitular: ${bankData.accountHolder}\nReferencia: ${bankData.reference}`;
      await submitReport("transfer", notesBank);
      finishSuccess();
    });

  const handleCashSubmit = () =>
    run(async () => {
      if (!cashProof) throw new Error("Sube una foto como comprobante");
      const proofUrl = await uploadPaymentProof(payment.id, cashProof);
      await submitReport("cash", "Pago en efectivo", proofUrl);
      finishSuccess();
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                    onClick={handleClose}
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
                      ¡Pago reportado!
                    </h3>
                    <p className="text-gray-600">
                      Reportaste tu pago de {amountLabel}. El técnico lo revisará y lo confirmará.
                    </p>
                  </motion.div>
                ) : step === "method" ? (
                  // Step 1: Seleccionar método
                  <>
                    {/* Monto (fijo, lo define la reserva) */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-4">
                      <p className="text-sm font-semibold text-gray-900">Monto a pagar</p>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{amountLabel}</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Selecciona método de pago:
                      </p>

                      {METHODS.map((method) => (
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
                        onClick={handleClose}
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
                          USD {usdAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Equivale a {amountLabel}</p>
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
                      <h3 className="text-lg font-bold text-gray-900">Datos de la transferencia que hiciste</h3>

                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                        <p className="text-sm text-amber-800">
                          <strong>Monto a transferir:</strong> {amountLabel}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-900">Banco de origen</label>
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
                          <label className="text-sm font-semibold text-gray-900">Número de referencia / comprobante</label>
                          <input
                            type="text"
                            placeholder="Ej: 0012345678"
                            value={bankData.reference}
                            onChange={(e) => setBankData({ ...bankData, reference: e.target.value })}
                            className="w-full mt-1 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-emerald-600 focus:outline-none text-sm"
                          />
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
                          {amountLabel}
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
                            accept="image/jpeg,image/png,image/webp"
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
