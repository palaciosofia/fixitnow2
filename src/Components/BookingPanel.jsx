// src/Components/BookingPanel.jsx
// Cuadro "Reservar visita": día, hora disponible, servicio y descripción.
// Crea la reserva en una transacción (una por franja, evita reservas dobles)
// y su documento de pago.
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase";
import { useAuth } from "../context/AuthProvider";
import { combineDateTime, buildSlotId, buildHourlySlots, isPastSlot } from "../utils/slots";
import { createPayment } from "../services/payments";
import { formatCOP } from "../utils/money";
import { priceFrom } from "../utils/catalog";
import { Alert, Button, Field, Select, Textarea } from "../ui";
import { cx } from "../ui/cx";

const DAYS_AHEAD = 14;

/** Horario por defecto (8:00 a 18:00) para técnicos que aún no configuran el suyo */
function defaultHours() {
  return Array.from({ length: 10 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
}

function hourLabel(hh) {
  return dayjs(`2000-01-01T${hh}`).format("h:mm a").replace("am", "a. m.").replace("pm", "p. m.");
}

export default function BookingPanel({ tech, className }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const tid = tech?.id || tech?.uid;

  const servicios = useMemo(
    () => (tech?.servicios || []).filter((s) => s?.nombre),
    [tech]
  );
  const tieneHorarios = !!tech?.horarios && typeof tech.horarios === "object";

  // Próximos días con al menos una hora libre
  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = dayjs().add(i, "day");
      const ymd = d.format("YYYY-MM-DD");
      const base = tieneHorarios ? buildHourlySlots(tech, ymd) : defaultHours();
      const hours = base.filter((h) => !isPastSlot(ymd, h));
      out.push({ ymd, d, hours });
    }
    return out;
  }, [tech, tieneHorarios]);

  const firstAvailable = days.find((d) => d.hours.length)?.ymd || days[0]?.ymd;
  const [fecha, setFecha] = useState(firstAvailable);
  const [hora, setHora] = useState("");
  const [servicio, setServicio] = useState(servicios[0]?.nombre || "");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const horas = days.find((d) => d.ymd === fecha)?.hours || [];
  const servicioSel = servicios.find((s) => s.nombre === servicio);
  const amount = Number(servicioSel?.precioSugerido) > 0 ? Math.round(Number(servicioSel.precioSugerido)) : priceFrom(tech);
  const esPropio = user && tech?.uid === user.uid;

  function validate() {
    if (!user?.uid) return "Inicia sesión para reservar.";
    if (esPropio) return "No puedes reservar contigo mismo.";
    if (!fecha || !hora) return "Elige un día y una hora.";
    const d = combineDateTime(fecha, hora);
    if (!d || isNaN(d.getTime())) return "Fecha u hora inválidas.";
    if (d.getTime() < Date.now() - 60_000) return "Esa hora ya pasó. Elige otra.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormErr("");
    const v = validate();
    if (v) return setFormErr(v);

    try {
      setSaving(true);
      const start = hora;
      const end = dayjs(`${fecha}T${start}`).add(1, "hour").format("HH:00");
      const scheduledAtDate = combineDateTime(fecha, start);
      const rid = buildSlotId(tid, scheduledAtDate);

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "reservas", rid);
        const existing = await tx.get(ref);
        if (existing.exists()) throw new Error("Ese horario ya está reservado. Elige otra hora.");

        tx.set(ref, {
          technicianId: tid,
          technicianName: tech?.nombre || "",
          technicianCiudad: tech?.ciudad || "",
          technicianSlug: tech?.slug || null,
          clientId: user.uid,
          clientName: user.displayName || null,
          clientEmail: user.email || null,
          date: fecha,
          start,
          end,
          scheduledAt: Timestamp.fromDate(scheduledAtDate),
          serviceName: servicio || null,
          description: (desc || "").trim(),
          status: "solicitada",
          createdAt: serverTimestamp(),
          fuente: "web",
          amount,
          paymentId: rid,
          paymentStatus: "pending",
          paymentMethod: null,
          paymentNote: null,
          paymentUpdatedAt: null,
        });
      });

      try {
        await createPayment({
          bookingId: rid,
          clientId: user.uid,
          clientName: user.displayName || user.email || null,
          technicianId: tid,
          technicianName: tech?.nombre || null,
          amount,
        });
      } catch (err) {
        // La reserva ya quedó creada; el pago se crea al abrirlo desde "Mis reservas".
        console.error("No se pudo crear el documento de pago:", err);
      }

      nav("/mis-reservas", {
        state: { flash: `Reserva enviada. Te avisaremos cuando ${tech?.nombre || "el técnico"} la confirme.` },
      });
    } catch (e) {
      console.error(e);
      // Con las reglas de seguridad, leer la reserva de otro cliente da "permission-denied":
      // significa que esa franja ya está tomada.
      setFormErr(
        e?.code === "permission-denied"
          ? "Ese horario ya está reservado. Elige otra hora."
          : e?.message || "No pudimos crear la reserva. Intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cx("rounded-2xl border border-line bg-white p-5", className)} aria-labelledby="h-reservar">
      <h2 id="h-reservar" className="text-[17px] font-semibold">Reservar visita</h2>
      <p className="mt-1 text-[13px] text-muted">Visitas de 1 hora · Pagas al terminar</p>

      {tech?.disponible === false && (
        <Alert tone="warning" className="mt-4">Este técnico marcó que por ahora no toma trabajos nuevos. Puede tardar en responder.</Alert>
      )}

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-medium">Día</legend>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {days.map(({ ymd, d, hours }) => {
            const active = ymd === fecha;
            const disabled = hours.length === 0;
            return (
              <button
                key={ymd}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                aria-label={`${d.format("dddd D [de] MMMM")}${disabled ? ", sin horas libres" : ""}`}
                onClick={() => { setFecha(ymd); setHora(""); }}
                className={cx(
                  "flex h-[58px] w-[52px] shrink-0 flex-col items-center justify-center rounded-[10px] text-xs leading-tight transition-colors",
                  active ? "bg-brand text-white" : "border border-line bg-white text-ink hover:border-brand",
                  disabled && "cursor-not-allowed border-dashed bg-canvas text-subtle hover:border-line"
                )}
              >
                <span className={cx("capitalize", !active && "text-subtle")}>{d.format("ddd").replace(".", "")}</span>
                <span className="text-base font-semibold">{d.format("D")}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[13px] font-medium">Hora disponible</legend>
        {horas.length === 0 ? (
          <p className="rounded-[10px] bg-canvas px-3 py-3 text-[13px] text-muted">No atiende este día. Elige otro.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {horas.map((h) => {
              const active = h === hora;
              return (
                <button
                  key={h}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setHora(h)}
                  className={cx(
                    "h-10 rounded-[10px] text-[13px] transition-colors",
                    active ? "border-2 border-brand bg-[#F7F6FF] font-semibold text-brand-ink" : "border border-line bg-white hover:border-brand"
                  )}
                >
                  {hourLabel(h)}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {servicios.length > 0 && (
        <Field label="Servicio" className="mt-4">
          {(id) => (
            <Select id={id} value={servicio} onChange={(e) => setServicio(e.target.value)}>
              {servicios.map((s) => (
                <option key={s.nombre} value={s.nombre}>
                  {s.nombre}{Number(s.precioSugerido) > 0 ? ` — ${formatCOP(s.precioSugerido)}` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <Field label="Cuéntale qué pasa" className="mt-3" optional>
        {(id) => (
          <Textarea id={id} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: la llave del lavaplatos gotea por la base" maxLength={1000} />
        )}
      </Field>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-[#F0F0F3] pt-3.5 text-[13px] text-muted">
        <div className="flex justify-between">
          <span className="first-letter:uppercase">{fecha ? dayjs(fecha).format("dddd D MMM") : "—"}{hora ? ` · ${hourLabel(hora)}` : ""}</span>
          <span>1 h</span>
        </div>
        <div className="flex justify-between text-[15px] text-ink">
          <span className="font-medium">Total estimado</span>
          <span className="font-bold">{amount > 0 ? formatCOP(amount) : "A convenir"}</span>
        </div>
      </div>

      {formErr && <Alert tone="danger" className="mt-3">{formErr}</Alert>}

      {user ? (
        <Button type="submit" size="lg" className="mt-4 w-full" loading={saving} disabled={esPropio}>
          Solicitar reserva
        </Button>
      ) : (
        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => nav("/auth/login", { state: { from: location } })}
        >
          Inicia sesión para reservar
        </Button>
      )}
      <p className="mt-2.5 text-center text-xs leading-relaxed text-subtle">
        {tech?.nombre?.split(" ")[0] || "El técnico"} confirma la reserva. No pagas nada hasta que el trabajo esté hecho.
      </p>
    </form>
  );
}
