// src/Pages/Auth/Login/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../../../services/auth"; 
import { auth } from "../../../firebase";
import { getIdTokenResult } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { Alert, Button, Field, Input, Logo } from "../../../ui";
import { Divider, GoogleButton } from "../AuthParts";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const friendlyError = (e) => {
    const message = e?.message || "";
    if (message.includes("auth/invalid-credential")) return "Correo o contraseña incorrectos.";
    if (message.includes("auth/user-not-found")) return "Usuario no encontrado.";
    if (message.includes("auth/user-disabled")) return "Tu cuenta está deshabilitada.";
    if (message.includes("auth/too-many-requests")) return "Demasiados intentos. Intenta luego.";
    if (message.includes("auth/popup-closed-by-user")) return "Cerraste la ventana de Google antes de terminar.";
    return message || "No se pudo iniciar sesión.";
  };

  
  const navigateAfterLogin = async (profile) => {
    const u = auth.currentUser;
    let isAdmin = false;

    if (u) {
      const tokenRes = await getIdTokenResult(u, true);
      isAdmin = tokenRes.claims?.admin === true;
    }

    // 1) Admin → /admin
    if (isAdmin) {
      nav("/admin", { replace: true });
      return;
    }

    // 2) Si venía de una ruta protegida
    const from = loc.state?.from;
    if (from) {
      nav(from, { replace: true });
      return;
    }

    // 3) Por rol
    const role = profile?.role;
    if (role === "tecnico") {
      nav("/mi-perfil", { replace: true });
    } else {
      nav("/", { replace: true });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");

    if (!/\S+@\S+\.\S+/.test(form.email)) return setErr("Correo inválido.");
    if (!form.password) return setErr("Ingresa tu contraseña.");

    try {
      setLoading(true);

      const { profile } = await loginUser(form);
      await navigateAfterLogin(profile);
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  
  const onGoogleLogin = async () => {
    if (loading) return;
    setErr("");

    try {
      setLoading(true);
      const { profile } = await loginWithGoogle();
      await navigateAfterLogin(profile);
    } catch (e) {
      console.error(e);
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <main className="w-full max-w-[420px] rounded-[20px] border border-line bg-white p-6 sm:p-8">
        <Logo compact />
        <h1 className="mt-5 text-[26px] font-semibold">Bienvenido de nuevo</h1>
        <p className="mt-1.5 text-sm text-muted">Entra para ver tus reservas y mensajes.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
          <Field label="Correo electrónico">
            {(id) => (
              <Input id={id} name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} placeholder="tucorreo@ejemplo.com" required />
            )}
          </Field>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-pwd" className="text-[13px] font-medium">Contraseña</label>
              <Link to="/auth/forgot" className="text-[13px] text-brand-ink hover:underline">¿La olvidaste?</Link>
            </div>
            <div className="relative">
              <Input
                id="login-pwd"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                className="pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-ink"
              >
                {showPwd ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {err && <Alert tone="danger">{err}</Alert>}

          <Button type="submit" size="lg" loading={loading}>Iniciar sesión</Button>
          <Divider />
          <GoogleButton onClick={onGoogleLogin} disabled={loading} />
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link to="/auth/register" className="font-medium text-brand-ink hover:underline">Crear una</Link>
        </p>
      </main>
    </div>
  );
}
