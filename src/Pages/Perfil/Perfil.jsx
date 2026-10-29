// src/Pages/Perfil/Perfil.jsx
// Perfil de la persona: datos personales editables, pagos y reseñas que dejó.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import dayjs from "dayjs";
import { ChevronRight, MessageSquareText, Star } from "lucide-react";
import { auth, db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { getClientReviews } from "../../services/reviews";
import { logoutUser, sendReset } from "../../services/auth";
import ClientPayments from "../../Components/ClientPayments";
import { Alert, Avatar, Button, Card, CardTitle, EmptyState, Field, Input, Select, UnderlineTabs } from "../../ui";
import { cx } from "../../ui/cx";

const ROLE_LABEL = { cliente: "Cliente", tecnico: "Técnico", admin: "Administrador" };

export default function Perfil() {
  const { user, profile, role, isCliente } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = isCliente ? params.get("tab") || "datos" : "datos";
  const setTab = (t) => setParams(t === "datos" ? {} : { tab: t }, { replace: true });

  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!user?.uid || !isCliente) return;
    getClientReviews(user.uid).then(setReviews).catch((e) => console.error("Error cargando reseñas:", e));
  }, [user?.uid, isCliente]);

  const nombre = profile?.name || user?.displayName || "Tu cuenta";
  const desde = profile?.createdAt?.toDate?.();

  return (
    <div>
      <Card className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <Avatar name={nombre} src={profile?.photoURL} size={72} />
        <div className="min-w-[200px] flex-1">
          <h1 className="text-[22px] font-semibold">{nombre}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {[user?.email, ROLE_LABEL[role], desde ? `desde ${dayjs(desde).format("MMMM YYYY")}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {isCliente && (
          <div className="flex gap-6 text-[13px] text-muted">
            <span><span className="block text-xl font-semibold text-ink">{reviews.length}</span>reseñas</span>
          </div>
        )}
      </Card>

      {isCliente && (
        <UnderlineTabs
          className="mt-5"
          label="Secciones del perfil"
          value={tab}
          onChange={setTab}
          items={[
            { value: "datos", label: "Datos personales" },
            { value: "pagos", label: "Pagos" },
            { value: "resenas", label: "Mis reseñas" },
          ]}
        />
      )}

      <div className="mt-5">
        {tab === "datos" && <DatosTab user={user} profile={profile} role={role} />}
        {tab === "pagos" && <ClientPayments uid={user.uid} />}
        {tab === "resenas" && <ResenasTab reviews={reviews} />}
      </div>
    </div>
  );
}

function DatosTab({ user, profile, role }) {
  const initial = {
    name: profile?.name || user?.displayName || "",
    telefono: profile?.telefono || "",
    ciudad: profile?.ciudad || "Barranquilla",
    barrio: profile?.barrio || "",
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resetMsg, setResetMsg] = useState(null);

  // Si el perfil llega después (tiempo real), rellena el formulario una vez
  const [synced, setSynced] = useState(!!profile);
  useEffect(() => {
    if (!synced && profile) {
      setForm({
        name: profile.name || user?.displayName || "",
        telefono: profile.telefono || "",
        ciudad: profile.ciudad || "Barranquilla",
        barrio: profile.barrio || "",
      });
      setSynced(true);
    }
  }, [profile, synced, user?.displayName]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) return setMsg({ tone: "danger", text: "Escribe tu nombre." });
    if (form.telefono && !/^\+?\d[\d\s-]{6,}$/.test(form.telefono)) {
      return setMsg({ tone: "danger", text: "Revisa el teléfono: solo números, mínimo 7." });
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: form.name.trim(),
          telefono: form.telefono.trim() || null,
          ciudad: form.ciudad || null,
          barrio: form.barrio.trim() || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (auth.currentUser && auth.currentUser.displayName !== form.name.trim()) {
        await updateProfile(auth.currentUser, { displayName: form.name.trim() }).catch(() => {});
      }
      setMsg({ tone: "success", text: "Guardamos tus cambios." });
    } catch (err) {
      console.error(err);
      setMsg({ tone: "danger", text: "No pudimos guardar los cambios. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    setResetMsg(null);
    try {
      await sendReset(user.email);
      setResetMsg({ tone: "success", text: `Te enviamos un enlace a ${user.email}.` });
    } catch {
      setResetMsg({ tone: "danger", text: "No pudimos enviar el correo. Intenta más tarde." });
    }
  };

  const esGoogle = user?.providerData?.some((p) => p.providerId === "google.com");

  return (
    <div className="flex flex-wrap items-start gap-5">
      <Card as="form" onSubmit={onSave} className="min-w-0 flex-[999_1_420px] p-5 sm:p-6">
        <CardTitle>Datos personales</CardTitle>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Nombre completo">
            {(id) => <Input id={id} name="name" autoComplete="name" value={form.name} onChange={onChange} />}
          </Field>
          <Field label="Teléfono">
            {(id) => <Input id={id} name="telefono" type="tel" autoComplete="tel" value={form.telefono} onChange={onChange} placeholder="+57 300 000 0000" />}
          </Field>
          <Field label="Ciudad">
            {(id) => (
              <Select id={id} name="ciudad" value={form.ciudad} onChange={onChange}>
                {["Barranquilla", "Soledad", "Puerto Colombia", "Malambo", "Galapa"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Barrio">
            {(id) => <Input id={id} name="barrio" value={form.barrio} onChange={onChange} />}
          </Field>
          <Field label="Correo electrónico" className="sm:col-span-2" hint="El correo no se puede cambiar desde aquí.">
            {(id) => <Input id={id} value={user?.email || ""} disabled />}
          </Field>
        </div>
        {msg && <Alert tone={msg.tone} className="mt-4">{msg.text}</Alert>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setForm(initial); setMsg(null); }}>Descartar</Button>
          <Button type="submit" loading={saving}>Guardar cambios</Button>
        </div>
      </Card>

      <aside className="flex w-full flex-[1_1_260px] flex-col gap-3 lg:max-w-[320px]">
        <Card className="p-5">
          <CardTitle className="mb-2">Cuenta y seguridad</CardTitle>
          {!esGoogle && (
            <button type="button" onClick={onResetPassword} className="flex min-h-11 w-full items-center justify-between border-t border-[#F0F0F3] text-left text-sm hover:text-brand-ink">
              Cambiar contraseña <ChevronRight className="h-4 w-4 text-subtle" aria-hidden="true" />
            </button>
          )}
          {resetMsg && <Alert tone={resetMsg.tone} className="my-2">{resetMsg.text}</Alert>}
          <button type="button" onClick={logoutUser} className="flex min-h-11 w-full items-center justify-between border-t border-[#F0F0F3] text-left text-sm text-bad">
            Cerrar sesión <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </Card>
        {role === "cliente" && (
          <div className="rounded-2xl bg-brand-tint p-5">
            <h2 className="text-[15px] font-semibold">¿Sabes un oficio?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#3F3F46]">
              Para ofrecer tus servicios crea una cuenta de técnico con otro correo, o escríbenos desde <Link to="/contacto" className="font-medium text-brand-ink underline">Contacto</Link>.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ResenasTab({ reviews }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="No has dejado reseñas todavía"
        text="Después de cada servicio pagado puedes calificar al técnico desde Mis reservas."
        action={<Button variant="secondary" to="/mis-reservas">Ir a Mis reservas</Button>}
      />
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul>
        {reviews.map((r) => (
          <li key={r.id} className="border-t border-[#F0F0F3] px-5 py-4 first:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{r.technicianName || "Técnico"}</p>
              <span className="flex gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cx("h-4 w-4", n <= r.rating ? "fill-star text-star" : "text-line")} aria-hidden="true" />
                ))}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-relaxed text-[#3F3F46]">{r.comment}</p>}
            {r.createdAt?.toDate && <p className="mt-2 text-xs text-subtle">{dayjs(r.createdAt.toDate()).format("D MMM YYYY")}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
