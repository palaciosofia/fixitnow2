// src/Components/PaymentModal.jsx
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Upload, Landmark, Banknote, CreditCard } from "lucide-react";
import { Alert, Button, Field, Input, Modal, Textarea } from "../ui";
import { cx } from "../ui/cx";
import { reportPaymentByClient, uploadPaymentProof, formatAmount } from "../services/payments";

// PayPal solo aparece si está configurado en el .env.
// PayPal no acepta COP, así que se convierte a USD con la tasa configurada.
const PAYPAL_BUSINESS_ID = import.meta.env.VITE_PAYPAL_BUSINESS_ID || "";
const COP_PER_USD = Number(import.meta.env.VITE_COP_PER_USD) || 0;
const PAYPAL_ENABLED = Boolean(PAYPAL_BUSINESS_ID && COP_PER_USD > 0);

const METHODS = [
  PAYPAL_ENABLED && { id: "paypal", icon: CreditCard, label: "PayPal", desc: "Pago en línea (se cobra en USD)" },
  { id: "transfer", icon: Landmark, label: "Transferencia o Nequi", desc: "Reporta la transferencia que ya hiciste" },
  { id: "cash", icon: Banknote, label: "Efectivo", desc: "Pago en persona, con foto del recibo" },
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

  const finishSuccess = () => setSuccess(true);

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

  const titles = {
    method: "Registrar pago",
    paypal: "Pagar con PayPal",
    transfer: "Transferencia bancaria",
    cash: "Pago en efectivo",
  };

  const back = (
    <Button variant="ghost" onClick={() => { setStep("method"); setError(""); }}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Atrás
    </Button>
  );

  return (
    <Modal open={isOpen && !!payment} onClose={handleClose} title={success ? "Pago reportado" : titles[step]}>
      {success ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ok" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold">Reportaste tu pago de {amountLabel}</p>
          <p className="mt-1 text-sm text-muted">Queda “En revisión” hasta que el técnico confirme que lo recibió.</p>
          <Button className="mt-5" onClick={() => { onPaymentSuccess?.(); handleClose(); }}>Listo</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-brand-tint px-4 py-3">
            <p className="text-[13px] text-muted">Monto a pagar</p>
            <p className="text-2xl font-bold text-brand-ink">{step === "paypal" && usdAmount ? `USD ${usdAmount.toFixed(2)}` : amountLabel}</p>
            {step === "paypal" && usdAmount > 0 && <p className="text-xs text-muted">Equivale a {amountLabel}</p>}
          </div>

          {step === "method" && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-medium">¿Cómo pagaste?</legend>
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setSelectedMethod(m.id); setStep(m.id); }}
                  className={cx(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors hover:border-brand",
                    selectedMethod === m.id ? "border-brand bg-[#F7F6FF]" : "border-line"
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand-ink">
                    <m.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted">{m.desc}</span>
                  </span>
                </button>
              ))}
            </fieldset>
          )}

          {step === "transfer" && (
            <>
              <Field label="Banco de origen">
                {(id) => <Input id={id} value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} placeholder="Bancolombia, Nequi, Daviplata…" />}
              </Field>
              <Field label="Titular de la cuenta">
                {(id) => <Input id={id} value={bankData.accountHolder} onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })} placeholder="Nombre completo" />}
              </Field>
              <Field label="Número de referencia o comprobante">
                {(id) => <Input id={id} value={bankData.reference} onChange={(e) => setBankData({ ...bankData, reference: e.target.value })} placeholder="Ej: 0012345678" />}
              </Field>
            </>
          )}

          {step === "cash" && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-medium">Foto del comprobante o del recibo</p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-field bg-canvas p-5 text-center hover:border-brand">
                <Upload className="h-6 w-6 text-subtle" aria-hidden="true" />
                <span className="text-sm font-medium">{cashProof ? cashProof.name : "Elegir foto"}</span>
                <span className="text-xs text-subtle">JPG, PNG o WEBP · máximo 5 MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCashProofUpload} className="sr-only" />
              </label>
              {cashProofPreview && <img src={cashProofPreview} alt="Vista previa del comprobante" className="h-36 w-full rounded-xl object-cover" />}
            </div>
          )}

          {step === "paypal" && (
            <p className="text-sm text-muted">Te llevaremos a PayPal para completar el pago. El técnico lo confirmará cuando le llegue.</p>
          )}

          {step !== "method" && (
            <Field label="Notas" optional>
              {(id) => <Textarea id={id} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo que el técnico deba saber" />}
            </Field>
          )}

          {error && <Alert tone="danger">{error}</Alert>}

          {step === "method" ? (
            <Button variant="ghost" onClick={handleClose} className="self-end">Cancelar</Button>
          ) : (
            <div className="flex justify-between gap-2">
              {back}
              <Button
                loading={loading}
                onClick={step === "paypal" ? handlePayPalRedirect : step === "transfer" ? handleBankTransferSubmit : handleCashSubmit}
              >
                {step === "paypal" ? "Ir a PayPal" : "Reportar pago"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
