// src/Pages/Tecnico/Dashboard.jsx
// Panel del técnico: editar su perfil público, ver pagos recibidos y reseñas.
// Pestañas por URL: /mi-perfil, /mi-perfil?tab=pagos, /mi-perfil?tab=resenas
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Camera, Check, Eye, Plus, Star, X, MessageSquareText } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import useMyTechId from "../../hooks/useMyTechId";
import {
  ensureMyTechnicianDoc,
  getMyTechnicianDoc,
  saveMyTechnicianDoc,
  setPublicado,
  DEFAULT_HORARIOS,
  normalizeHorarios,
} from "../../services/technicians";
import { uploadToCloudinary } from "../../services/images";
import { getTechnicianReviews } from "../../services/reviews";
import { clThumb } from "../../utils/cloudinary";
import { ESPECIALIDADES, priceFrom, techPath } from "../../utils/catalog";
import { formatCOP } from "../../utils/money";
import TechnicianPaymentsTab from "../../Components/TechnicianPaymentsTab";
import {
  Alert, Avatar, Badge, Button, Card, CardTitle, EmptyState, Field, Input, Loader,
  PageHeader, Rating, Select, SpecialtyCover, Textarea, UnderlineTabs,
} from "../../ui";
import { cx } from "../../ui/cx";

// Localidades y municipios del área metropolitana de Barranquilla
const ZONAS_PREDEF = [
  "Norte - Centro Histórico", "Riomar", "Suroccidente", "Suroriente", "Metropolitana",
  "Soledad", "Puerto Colombia", "Malambo", "Galapa",
];
const CIUDADES = ["Barranquilla", "Soledad", "Puerto Colombia", "Malambo", "Galapa"];
const MIN_BIO = 120;

const EMPTY = {
  fotoURL: "",
  nombre: "",
  bioCorta: "",
  ciudad: "",
  especialidades: [],
  servicios: [], // [{ nombre, precioSugerido }]
  zonasCobertura: [],
  aniosExperiencia: 0,
  disponible: true,
  horarios: DEFAULT_HORARIOS,
  telefono: "",
  certificaciones: [],
  disponibilidadTxt: "",
};

export default function TecnicoDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const { tid } = useMyTechId(user?.uid);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "perfil";
  const setTab = (t) => setParams(t === "perfil" ? {} : { tab: t }, { replace: true });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null); // { tone, text }
  const [docTech, setDocTech] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ------- Carga inicial -------
  useEffect(() => {
    const boot = async () => {
      if (authLoading) return;
      if (!user || (role !== "tecnico" && role !== "admin")) {
        setMsg({ tone: "danger", text: "Debes iniciar sesión como técnico." });
        setLoading(false);
        return;
      }
      try {
        await ensureMyTechnicianDoc(user.uid, { nombre: user.displayName || "" });
        const data = await getMyTechnicianDoc(user.uid);
        setDocTech(data);
        setForm({
          ...EMPTY,
          ...data,
          servicios: Array.isArray(data?.servicios) ? data.servicios : [],
          especialidades: Array.isArray(data?.especialidades) ? data.especialidades : [],
          zonasCobertura: Array.isArray(data?.zonasCobertura) ? data.zonasCobertura : [],
          certificaciones: Array.isArray(data?.certificaciones) ? data.certificaciones : [],
          horarios: normalizeHorarios(data?.horarios),
        });
      } catch (e) {
        console.error(e);
        setMsg({ tone: "danger", text: "No se pudo cargar tu perfil técnico." });
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [user, role, authLoading]);

  // ------- Reseñas -------
  useEffect(() => {
    if (!tid) return;
    setReviewsLoading(true);
    getTechnicianReviews(tid)
      .then(setReviews)
      .catch((e) => console.error("Error cargando reseñas:", e))
      .finally(() => setReviewsLoading(false));
  }, [tid]);

  // ------- Helpers de estado -------
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const toggleIn = (k, value) =>
    setForm((s) => {
      const arr = s[k] || [];
      return { ...s, [k]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  const setServicio = (i, patch) =>
    setForm((s) => {
      const arr = [...s.servicios];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, servicios: arr };
    });

  const checklist = useMemo(() => {
    const items = [
      { key: "foto", label: "Foto de perfil", ok: !!form.fotoURL },
      { key: "bio", label: `“Sobre ti” de ${MIN_BIO} caracteres`, ok: (form.bioCorta || "").trim().length >= MIN_BIO },
      { key: "esp", label: "Al menos una especialidad", ok: (form.especialidades || []).length >= 1 },
      {
        key: "serv",
        label: "Un servicio con precio",
        ok: (form.servicios || []).some((s) => String(s?.nombre || "").trim() && Number(s?.precioSugerido) > 0),
      },
      { key: "ciudad", label: "Ciudad", ok: !!(form.ciudad || "").trim() },
      { key: "zonas", label: "Zonas donde trabajas", ok: (form.zonasCobertura || []).length >= 1 },
    ];
    return { items, done: items.filter((i) => i.ok).length, all: items.every((i) => i.ok) };
  }, [form]);

  // ------- Guardar -------
  const onSave = async () => {
    if (!user) return false;
    setSaving(true);
    setMsg(null);
    try {
      const servicios = (form.servicios || [])
        .map((s) => ({
          nombre: String(s.nombre || "").trim(),
          precioSugerido: s.precioSugerido === "" || s.precioSugerido == null ? 0 : Number(s.precioSugerido),
        }))
        .filter((s) => s.nombre);
      // Precio "desde": el servicio más barato. Lo usan el catálogo y las reservas.
      const precios = servicios.map((x) => x.precioSugerido).filter((n) => Number.isFinite(n) && n > 0);
      await saveMyTechnicianDoc(user.uid, {
        ...form,
        servicios,
        aniosExperiencia: Number(form.aniosExperiencia) || 0,
        tarifaBase: precios.length ? Math.min(...precios) : null,
        certificaciones: Array.isArray(form.certificaciones) ? form.certificaciones : [],
        disponibilidadTxt: form.disponibilidadTxt || "",
        telefono: (form.telefono || "").trim(),
      });
      const data = await getMyTechnicianDoc(user.uid);
      setDocTech(data);
      setMsg({ tone: "success", text: "Guardamos tus cambios." });
      return true;
    } catch (e) {
      console.error(e);
      setMsg({ tone: "danger", text: "No pudimos guardar los cambios." });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    if (!checklist.all) {
      setMsg({ tone: "warning", text: "Completa los pasos de la lista para publicar tu perfil." });
      return;
    }
    setPubLoading(true);
    try {
      if (!(await onSave())) return;
      await setPublicado(user.uid, true);
      setDocTech(await getMyTechnicianDoc(user.uid));
      setMsg({ tone: "success", text: "¡Tu perfil ya está publicado en el catálogo!" });
    } catch (e) {
      console.error(e);
      setMsg({ tone: "danger", text: docTech?.blocked ? "Un administrador bloqueó tu perfil. Escríbenos desde Contacto." : "No pudimos publicar el perfil." });
    } finally {
      setPubLoading(false);
    }
  };

  const onUnpublish = async () => {
    setPubLoading(true);
    setMsg(null);
    try {
      await setPublicado(user.uid, false);
      setDocTech(await getMyTechnicianDoc(user.uid));
      setMsg({ tone: "success", text: "Ocultamos tu perfil del catálogo." });
    } catch (e) {
      console.error(e);
      setMsg({ tone: "danger", text: "No pudimos ocultar el perfil." });
    } finally {
      setPubLoading(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    setMsg(null);
    try {
      const { secureUrl } = await uploadToCloudinary(file, { folder: "tech_photos" });
      set("fotoURL", secureUrl);
      await saveMyTechnicianDoc(user.uid, { fotoURL: secureUrl });
      setMsg({ tone: "success", text: "Subimos tu foto." });
    } catch (err) {
      console.error(err);
      setMsg({ tone: "danger", text: err.message || "No pudimos subir tu foto." });
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) return <Loader label="Cargando tu perfil…" />;

  const publicado = !!docTech?.publicado;
  const zonas = [...new Set([...ZONAS_PREDEF, ...(form.zonasCobertura || [])])];
  const bioLen = (form.bioCorta || "").trim().length;
  const preview = { ...docTech, ...form, tarifaBase: null };

  return (
    <div>
      <PageHeader
        title="Mi perfil de técnico"
        badge={
          docTech?.blocked ? <Badge tone="danger">Bloqueado</Badge> :
          publicado ? <Badge tone="success" dot>Publicado</Badge> : <Badge>Oculto del catálogo</Badge>
        }
        subtitle="Así te ven los clientes antes de reservar"
        actions={
          tab === "perfil" && (
            <>
              {docTech && <Button variant="secondary" to={techPath(docTech)}><Eye className="h-4 w-4" aria-hidden="true" /> Vista previa</Button>}
              <Button onClick={onSave} loading={saving} disabled={pubLoading}>Guardar cambios</Button>
            </>
          )
        }
      />

      <UnderlineTabs
        label="Secciones"
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          { value: "perfil", label: "Perfil" },
          { value: "pagos", label: "Pagos" },
          { value: "resenas", label: `Reseñas${reviews.length ? ` · ${reviews.length}` : ""}` },
        ]}
      />

      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}

      {tab === "pagos" && (tid ? <TechnicianPaymentsTab technicianId={tid} /> : <Loader />)}
      {tab === "resenas" && <ReviewsTab reviews={reviews} loading={reviewsLoading} />}

      {tab === "perfil" && (
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-4">
            {/* Foto y presentación */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Foto y presentación</CardTitle>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={form.nombre || user?.displayName} src={form.fotoURL ? clThumb(form.fotoURL, { w: 144, h: 144 }) : ""} size={72} />
                <div className="flex flex-col gap-1.5">
                  <label className={cx("inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 text-[13px] font-semibold hover:bg-canvas", uploading && "pointer-events-none opacity-60")}>
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    {uploading ? "Subiendo…" : form.fotoURL ? "Cambiar foto" : "Subir foto"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="sr-only" />
                  </label>
                  <span className="text-xs text-subtle">JPG, PNG o WEBP · máximo 5 MB</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <Field label="Nombre público">
                  {(id) => <Input id={id} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />}
                </Field>
                <Field label="Años de experiencia">
                  {(id) => <Input id={id} type="number" min="0" max="60" value={form.aniosExperiencia} onChange={(e) => set("aniosExperiencia", e.target.value)} />}
                </Field>
                <Field label="Ciudad">
                  {(id) => (
                    <Select id={id} value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)}>
                      <option value="">Elige…</option>
                      {[...new Set([...CIUDADES, form.ciudad].filter(Boolean))].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Teléfono / WhatsApp" optional>
                  {(id) => <Input id={id} type="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+57 300 000 0000" />}
                </Field>
                <Field
                  label="Sobre ti"
                  className="sm:col-span-2"
                  hint={bioLen < MIN_BIO ? `${bioLen} / ${MIN_BIO} caracteres mínimo para publicar` : `${bioLen} caracteres`}
                >
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={4}
                      value={form.bioCorta}
                      onChange={(e) => set("bioCorta", e.target.value)}
                      placeholder="Qué trabajos haces, con qué herramientas, si das garantía o factura…"
                    />
                  )}
                </Field>
              </div>
            </Card>

            {/* Especialidades */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Especialidades</CardTitle>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Especialidades">
                {ESPECIALIDADES.map((esp) => {
                  const on = form.especialidades.includes(esp);
                  return (
                    <button
                      key={esp}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleIn("especialidades", esp)}
                      className={cx(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors",
                        on ? "bg-brand font-medium text-white" : "border border-line bg-white hover:border-brand"
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {esp}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Servicios */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Servicios y precios</CardTitle>
              <p className="-mt-2 mb-4 text-[13px] text-subtle">El más barato se muestra como tu precio “desde” en el catálogo.</p>
              <div className="flex flex-col gap-2">
                {form.servicios.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input aria-label={`Servicio ${i + 1}`} value={s.nombre} onChange={(e) => setServicio(i, { nombre: e.target.value })} placeholder="Ej: Cambio de grifería" className="flex-1" />
                    <div className="relative w-[140px] shrink-0">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle">$</span>
                      <Input aria-label={`Precio del servicio ${i + 1}`} type="number" min="0" step="1000" inputMode="numeric" value={s.precioSugerido} onChange={(e) => setServicio(i, { precioSugerido: e.target.value })} placeholder="60000" className="pl-6" />
                    </div>
                    <Button variant="secondary" size="icon" className="shrink-0 rounded-[10px]" aria-label={`Quitar servicio ${i + 1}`} onClick={() => set("servicios", form.servicios.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2.5 border border-dashed border-field text-brand-ink" onClick={() => set("servicios", [...form.servicios, { nombre: "", precioSugerido: "" }])}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Agregar servicio
              </Button>
            </Card>

            {/* Zonas */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Zonas donde trabajas</CardTitle>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Zonas">
                {zonas.map((z) => {
                  const on = form.zonasCobertura.includes(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleIn("zonasCobertura", z)}
                      className={cx(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors",
                        on ? "bg-brand font-medium text-white" : "border border-line bg-white hover:border-brand"
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {z}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Horario */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Horario reservable</CardTitle>
              <p className="-mt-2 mb-4 text-[13px] text-subtle">Los clientes solo pueden reservar dentro de estas horas.</p>
              <HorarioEditor value={form.horarios} onChange={(h) => set("horarios", h)} />
              <label className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-canvas px-4 text-sm">
                <span>
                  <span className="block font-medium">Disponible para nuevos trabajos</span>
                  <span className="block text-xs text-subtle">Si lo apagas, avisamos a los clientes que estás con la agenda llena.</span>
                </span>
                <input type="checkbox" checked={!!form.disponible} onChange={(e) => set("disponible", e.target.checked)} className="h-5 w-5 shrink-0 accent-brand" />
              </label>
              <Field label="Nota sobre tu disponibilidad" optional className="mt-4">
                {(id) => <Input id={id} value={form.disponibilidadTxt} onChange={(e) => set("disponibilidadTxt", e.target.value)} placeholder="Ej: urgencias los domingos con recargo" />}
              </Field>
            </Card>

            {/* Certificaciones */}
            <Card className="p-5 sm:p-6">
              <CardTitle>Certificaciones <span className="font-normal text-subtle">(opcional)</span></CardTitle>
              <CertificacionesEditor value={form.certificaciones} onChange={(arr) => set("certificaciones", arr)} />
            </Card>
          </div>

          {/* Columna lateral */}
          <aside className="flex w-full flex-[1_1_280px] flex-col gap-3 lg:sticky lg:top-24 lg:max-w-[320px]">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{publicado ? "Tu perfil está publicado" : "Para publicar tu perfil"}</h2>
              <div className="mt-2.5 flex justify-between text-[13px] text-muted">
                <span>{checklist.done} de {checklist.items.length} listos</span>
                <span>{Math.round((checklist.done / checklist.items.length) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded bg-[#F0F0F3]" aria-hidden="true">
                <div className="h-1.5 rounded bg-brand transition-all" style={{ width: `${(checklist.done / checklist.items.length) * 100}%` }} />
              </div>
              <ul className="mt-3.5 flex flex-col gap-2.5 text-sm">
                {checklist.items.map((it) => (
                  <li key={it.key} className={cx("flex items-center gap-2.5", !it.ok && "text-muted")}>
                    {it.ok ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-3 w-3" aria-hidden="true" /></span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border-[1.5px] border-field" aria-hidden="true" />
                    )}
                    {it.label}
                    <span className="sr-only">{it.ok ? "(listo)" : "(pendiente)"}</span>
                  </li>
                ))}
              </ul>
              {publicado ? (
                <Button variant="secondary" className="mt-4 w-full" onClick={onUnpublish} loading={pubLoading}>Ocultar del catálogo</Button>
              ) : (
                <Button className="mt-4 w-full" onClick={onPublish} loading={pubLoading} disabled={!checklist.all || saving || docTech?.blocked}>
                  Publicar perfil
                </Button>
              )}
            </Card>

            <Card className="p-3.5">
              <p className="mb-2.5 text-xs text-subtle">Así se verá en el catálogo</p>
              <div className="flex flex-col gap-1.5 rounded-xl border border-line p-2">
                <SpecialtyCover specialty={form.especialidades[0]} src={form.fotoURL} className="h-[110px]" iconSize={36} />
                <div className="flex justify-between px-1">
                  <span className="text-[15px] font-bold text-brand-ink">{priceFrom(preview) ? formatCOP(priceFrom(preview)) : "Precio a convenir"}</span>
                  <Rating value={docTech?.ratingPromedio} />
                </div>
                <p className="px-1 text-sm font-semibold">{form.servicios.find((s) => s.nombre)?.nombre || form.especialidades.slice(0, 2).join(" y ") || "Tu servicio principal"}</p>
                <p className="px-1 pb-1 text-xs text-muted">Por {form.nombre || "tu nombre"}{form.zonasCobertura[0] ? ` · ${form.zonasCobertura[0]}` : ""}</p>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ---------------- Reseñas ---------------- */
function ReviewsTab({ reviews, loading }) {
  if (loading) return <Loader label="Cargando reseñas…" />;
  if (!reviews.length) {
    return <EmptyState icon={MessageSquareText} title="Aún no tienes reseñas" text="Cuando tus clientes te califiquen, sus comentarios aparecerán aquí." />;
  }
  const avg = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;
  const sorted = [...reviews].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-[13px] text-muted">Calificación promedio</p><p className="mt-1.5 flex items-center gap-2 text-2xl font-semibold">{avg.toFixed(1)} <Star className="h-5 w-5 fill-star text-star" aria-hidden="true" /></p></Card>
        <Card className="p-4"><p className="text-[13px] text-muted">Reseñas</p><p className="mt-1.5 text-2xl font-semibold">{reviews.length}</p></Card>
        <Card className="p-4"><p className="text-[13px] text-muted">De 4 estrellas o más</p><p className="mt-1.5 text-2xl font-semibold">{reviews.filter((r) => r.rating >= 4).length}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <ul>
          {sorted.map((r) => (
            <li key={r.id} className="border-t border-[#F0F0F3] px-5 py-4 first:border-t-0">
              <div className="flex items-center gap-2.5">
                <Avatar name={r.clientName} size={32} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.clientName || "Cliente"}</p>
                  {r.createdAt?.toDate && <p className="text-xs text-subtle">{dayjs(r.createdAt.toDate()).format("D MMM YYYY")}</p>}
                </div>
                <span className="flex gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cx("h-4 w-4", n <= r.rating ? "fill-star text-star" : "text-line")} aria-hidden="true" />)}
                </span>
              </div>
              {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-[#3F3F46]">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------- Certificaciones ---------------- */
function CertificacionesEditor({ value = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(value || []), v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input
          aria-label="Nueva certificación"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ej: Técnico en refrigeración — SENA"
        />
        <Button variant="secondary" onClick={add}>Agregar</Button>
      </div>
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((c, i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-canvas py-1.5 pl-3 pr-1.5 text-[13px]">
              {typeof c === "string" ? c : c?.nombre}
              <button type="button" aria-label={`Quitar ${typeof c === "string" ? c : c?.nombre}`} onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="flex h-6 w-6 items-center justify-center rounded-full text-subtle hover:bg-white hover:text-ink">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Horario ---------------- */
const DIAS_SEMANA = [
  ["lun", "Lunes"], ["mar", "Martes"], ["mie", "Miércoles"], ["jue", "Jueves"],
  ["vie", "Viernes"], ["sab", "Sábado"], ["dom", "Domingo"],
];
const HORAS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

function HorarioEditor({ value, onChange }) {
  const horarios = value || {};
  const update = (dia, franja) => onChange({ ...horarios, [dia]: franja ? [franja] : [] });

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {DIAS_SEMANA.map(([key, label]) => {
        const franja = horarios[key]?.[0] || null;
        return (
          <div key={key} className={cx("flex min-h-11 flex-wrap items-center gap-3 rounded-[10px] px-3", franja ? "bg-canvas" : "")}>
            <label className="flex w-[120px] items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={!!franja}
                onChange={(e) => update(key, e.target.checked ? { inicio: "08:00", fin: "18:00" } : null)}
                className="h-[18px] w-[18px] accent-brand"
              />
              {label}
            </label>
            {franja ? (
              <span className="flex items-center gap-2">
                <select
                  aria-label={`${label}: desde`}
                  value={franja.inicio}
                  onChange={(e) => {
                    const inicio = e.target.value;
                    const fin = franja.fin > inicio ? franja.fin : HORAS[Math.min(HORAS.indexOf(inicio) + 1, 23)];
                    update(key, { inicio, fin });
                  }}
                  className="h-9 rounded-lg border border-field bg-white px-2 text-[13px]"
                >
                  {HORAS.slice(0, 23).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-subtle">a</span>
                <select
                  aria-label={`${label}: hasta`}
                  value={franja.fin}
                  onChange={(e) => update(key, { inicio: franja.inicio, fin: e.target.value })}
                  className="h-9 rounded-lg border border-field bg-white px-2 text-[13px]"
                >
                  {HORAS.filter((h) => h > franja.inicio).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </span>
            ) : (
              <span className="text-[13px] text-subtle">No atiende</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
