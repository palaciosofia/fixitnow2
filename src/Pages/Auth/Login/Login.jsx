// src/Pages/Auth/Login/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { loginUser } from "../../../services/auth";
import { auth } from "../../../firebase";
import { getIdTokenResult } from "firebase/auth";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

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
    if (message.includes("auth/invalid-credential")) return "Credenciales inválidas.";
    if (message.includes("auth/user-not-found")) return "Usuario no encontrado.";
    if (message.includes("auth/user-disabled")) return "Tu cuenta está deshabilitada.";
    if (message.includes("auth/too-many-requests")) return "Demasiados intentos. Intenta luego.";
    return message || "No se pudo iniciar sesión.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");

    if (!/\S+@\S+\.\S+/.test(form.email)) return setErr("Correo inválido.");
    if (!form.password) return setErr("Ingresa tu contraseña.");

    try {
      setLoading(true);

      // sign-in y lectura del perfil (Firestore)
      const { profile } = await loginUser(form);

      // claims para saber si es admin
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
        // 4) Cliente (u otro) → Inicio
        nav("/", { replace: true });
      }
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-400 text-white mb-3">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold">Bienvenido</h1>
          <p className="text-sm text-gray-600 mt-1">Accede a tu cuenta para gestionar reservas y perfil.</p>
        </div>

        {err && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 mb-4">
            <span className="text-sm">{err}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Correo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="correo@dominio.com"
                value={form.email}
                onChange={onChange}
                required
                className="w-full border rounded px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={onChange}
                required
                className="w-full border rounded px-3 py-2 pl-10 pr-10 outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="form-checkbox" /> <span>Recordarme</span>
            </label>
            <Link to="/auth/forgot" className="text-sm text-gray-600 hover:underline">Olvidé mi contraseña</Link>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-400 text-white font-medium shadow"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? "Ingresando..." : "Entrar"}</span>
            </button>

            <div className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link to="/auth/register" className="text-teal-600 hover:underline">Regístrate</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
