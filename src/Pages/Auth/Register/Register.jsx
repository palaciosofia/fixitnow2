// src/Pages/Auth/Register/Register.jsx
import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { registerUser, registerWithGoogle } from "../../../services/auth";
import { Search, CalendarDays, Wallet, UserRound } from "lucide-react";
import { Alert, Button, Field, Input, Logo, Select } from "../../../ui";
import { cx } from "../../../ui/cx";
import { Divider, GoogleButton } from "../AuthParts";

const ROLE_CACHE_KEY = "fixit_role";

export default function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: params.get("rol") === "tecnico" ? "tecnico" : "cliente",
    ciudad: "",
    barrio: "",
    telefono: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Ingresa tu nombre.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Correo inválido.";
    if (!form.password || form.password.length < 6)
      return "La contraseña debe tener mínimo 6 caracteres.";
    if (!form.ciudad.trim()) return "Elige tu ciudad.";
    if (!form.barrio.trim()) return "Ingresa tu barrio.";
    if (!/^\+?\d[\d\s-]{6,}$/.test(form.telefono)) return "Revisa el teléfono: solo números, mínimo 7.";
    if (!["cliente", "tecnico"].includes(form.role)) return "Rol inválido.";
    return "";
  };

  // Versión para Google (no exige email/contraseña)
  const validateForGoogle = () => {
    if (!form.name.trim()) return "Ingresa tu nombre.";
    if (!form.ciudad.trim()) return "Ingresa tu ciudad.";
    if (!form.barrio.trim()) return "Ingresa tu barrio.";
    if (!/^\+?\d[\d\s-]{6,}$/.test(form.telefono)) return "Teléfono inválido.";
    if (!["cliente", "tecnico"].includes(form.role)) return "Rol inválido.";
    return "";
  };

  const friendlyError = (e) => {
    const message = e?.message || "";
    if (message.includes("auth/email-already-in-use"))
      return "Ese correo ya está registrado.";
    if (message.includes("auth/invalid-email")) return "Correo inválido.";
    if (message.includes("auth/weak-password")) return "Contraseña débil.";
    return message || "No se pudo crear la cuenta.";
  };

  const redirectByRole = (role) => {
    if (role === "tecnico") {
      nav("/mi-perfil", { replace: true });
    } else {
      nav("/tecnicos", { replace: true });
    }
  };

  const cacheRole = (role) => {
    try {
      const safeRole = role === "tecnico" ? "tecnico" : "cliente";
      localStorage.setItem(ROLE_CACHE_KEY, safeRole);
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");

    const msg = validate();
    if (msg) return setErr(msg);

    try {
      setLoading(true);

      // Crea cuenta + doc users/{uid} con 'role'
      await registerUser(form);

      cacheRole(form.role);
      redirectByRole(form.role);
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  // 👉 NUEVO: registro usando Google, respetando el rol
  const onGoogleRegister = async () => {
    if (loading) return;
    setErr("");

    const msg = validateForGoogle();
    if (msg) return setErr(msg);

    try {
      setLoading(true);

      const { profile } = await registerWithGoogle({
        name: form.name,
        role: form.role,
        ciudad: form.ciudad,
        barrio: form.barrio,
        telefono: form.telefono,
      });

      const role = profile?.role || form.role;
      cacheRole(role);
      redirectByRole(role);
    } catch (e) {
      console.error(e);
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <main className="flex flex-[1_1_520px] flex-col items-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <Logo />
          <h1 className="mt-9 text-[30px] font-semibold tracking-[-0.03em]">Crea tu cuenta</h1>
          <p className="mt-1.5 text-sm text-muted">
            ¿Ya tienes una? <Link to="/auth/login" className="font-medium text-brand-ink hover:underline">Inicia sesión</Link>
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">¿Cómo vas a usar FixItNow?</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: "cliente", title: "Soy cliente", desc: "Busco un técnico" },
                  { value: "tecnico", title: "Soy técnico", desc: "Ofrezco mis servicios" },
                ].map((r) => {
                  const active = form.role === r.value;
                  return (
                    <label
                      key={r.value}
                      className={cx(
                        "flex cursor-pointer flex-col gap-1 rounded-xl px-3.5 py-3",
                        active ? "border-2 border-brand bg-[#F7F6FF]" : "border border-line p-[13px] hover:border-field"
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{r.title}</span>
                        <input type="radio" name="role" value={r.value} checked={active} onChange={onChange} className="h-[18px] w-[18px] accent-brand" />
                      </span>
                      <span className="text-xs text-muted">{r.desc}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <Field label="Nombre completo">
              {(id) => <Input id={id} name="name" autoComplete="name" value={form.name} onChange={onChange} placeholder="Tu nombre y apellido" />}
            </Field>
            <Field label="Correo electrónico">
              {(id) => <Input id={id} name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} placeholder="tucorreo@ejemplo.com" />}
            </Field>
            <Field label="Contraseña" hint="Mínimo 6 caracteres">
              {(id) => <Input id={id} name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} />}
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Ciudad">
                {(id) => (
                  <Select id={id} name="ciudad" value={form.ciudad} onChange={onChange}>
                    <option value="">Elige…</option>
                    <option>Barranquilla</option>
                    <option>Soledad</option>
                    <option>Puerto Colombia</option>
                    <option>Malambo</option>
                    <option>Galapa</option>
                  </Select>
                )}
              </Field>
              <Field label="Barrio">
                {(id) => <Input id={id} name="barrio" value={form.barrio} onChange={onChange} placeholder="Riomar" />}
              </Field>
            </div>
            <Field label="Teléfono">
              {(id) => <Input id={id} name="telefono" type="tel" autoComplete="tel" value={form.telefono} onChange={onChange} placeholder="+57 300 000 0000" />}
            </Field>

            <p className="text-xs leading-relaxed text-muted">
              Al crear tu cuenta aceptas los <Link to="/terminos" className="text-brand-ink hover:underline">Términos</Link> y la{" "}
              <Link to="/privacidad" className="text-brand-ink hover:underline">Política de privacidad</Link>.
            </p>

            {err && <Alert tone="danger">{err}</Alert>}

            <Button type="submit" size="lg" loading={loading}>Crear cuenta</Button>
            <Divider />
            <GoogleButton onClick={onGoogleRegister} disabled={loading} />
            <p className="text-center text-xs text-subtle">Con Google también te pedimos nombre, ciudad, barrio y teléfono.</p>
          </form>
        </div>
      </main>

      <aside className="m-4 hidden flex-[1_1_420px] flex-col justify-center gap-5 rounded-3xl bg-brand-tint p-10 lg:flex">
        <h2 className="max-w-[420px] text-[26px] font-semibold">
          {form.role === "tecnico" ? "Consigue clientes en tu zona" : "Todo lo que necesitas para arreglar tu casa, en un solo lugar"}
        </h2>
        <ul className="flex flex-col gap-3.5">
          {(form.role === "tecnico" ? TECNICO_POINTS : CLIENTE_POINTS).map((p) => (
            <li key={p.title} className="flex items-start gap-3.5 rounded-[14px] bg-white p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand-ink">
                <p.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{p.title}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{p.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

const CLIENTE_POINTS = [
  { icon: Search, title: "Compara antes de elegir", desc: "Precios, zonas y reseñas reales de cada técnico." },
  { icon: CalendarDays, title: "Reserva en su agenda", desc: "Solo ves las horas en que el técnico puede ir." },
  { icon: Wallet, title: "Paga al terminar", desc: "Registras el pago y el técnico lo confirma." },
];
const TECNICO_POINTS = [
  { icon: UserRound, title: "Tu perfil, tus precios", desc: "Publica tus servicios con el precio de cada uno." },
  { icon: CalendarDays, title: "Agenda ordenada", desc: "Define tu horario y recibe reservas solo en esas horas." },
  { icon: Wallet, title: "Pagos claros", desc: "Confirma cada pago que te reportan los clientes." },
];
