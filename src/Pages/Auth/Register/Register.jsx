// src/Pages/Auth/Register/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../../services/auth";
import { User, Mail, Lock, Phone, Check } from "lucide-react";

const ROLE_CACHE_KEY = "fixit_role";

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cliente",   // cliente | tecnico
    ciudad: "",
    barrio: "",
    telefono: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Ingresa tu nombre.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Correo inválido.";
    if (!form.password || form.password.length < 6) return "La contraseña debe tener mínimo 6 caracteres.";
    if (!form.ciudad.trim()) return "Ingresa tu ciudad.";
    if (!form.barrio.trim()) return "Ingresa tu barrio.";
    if (!/^\+?\d[\d\s-]{6,}$/.test(form.telefono)) return "Teléfono inválido.";
    if (!["cliente","tecnico"].includes(form.role)) return "Rol inválido.";
    return "";
  };

  const friendlyError = (e) => {
    const message = e?.message || "";
    if (message.includes("auth/email-already-in-use")) return "Ese correo ya está registrado.";
    if (message.includes("auth/invalid-email")) return "Correo inválido.";
    if (message.includes("auth/weak-password")) return "Contraseña débil.";
    return message || "No se pudo crear la cuenta.";
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

      // Cachear el rol para evitar parpadeo de UI al primer render post-registro
      try {
        const safeRole = form.role === "tecnico" ? "tecnico" : "cliente";
        localStorage.setItem(ROLE_CACHE_KEY, safeRole);
      } catch {}

      // Redirección según rol
      if (form.role === "tecnico") {
        nav("/tecnico", { replace: true });
      } else {
        nav("/perfil", { replace: true });
      }
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-5">
          <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-400 text-white mb-3">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
          <p className="text-sm text-gray-600 mt-1">Regístrate como cliente o técnico y comienza a recibir solicitudes.</p>
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 mb-4">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm mb-1">Nombre</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User className="w-4 h-4" /></span>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1">Correo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail className="w-4 h-4" /></span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="correo@dominio.com"
                value={form.email}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" /></span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ciudad" className="block text-sm mb-1">Ciudad</label>
              <input
                id="ciudad"
                name="ciudad"
                type="text"
                placeholder="Barranquilla"
                value={form.ciudad}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <div>
              <label htmlFor="barrio" className="block text-sm mb-1">Barrio</label>
              <input
                id="barrio"
                name="barrio"
                type="text"
                placeholder="El Prado"
                value={form.barrio}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm mb-1">Teléfono</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="w-4 h-4" /></span>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+57 300 000 0000"
                value={form.telefono}
                onChange={onChange}
                className="w-full border rounded px-3 py-2 pl-10 outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Rol</label>
            <div className="flex items-center gap-4">
              <label className={`inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer ${form.role === "cliente" ? "bg-gray-900 text-white" : "bg-white border"}`}>
                <input type="radio" name="role" value="cliente" checked={form.role === "cliente"} onChange={onChange} className="hidden" />
                <span>Cliente</span>
              </label>
              <label className={`inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer ${form.role === "tecnico" ? "bg-gray-900 text-white" : "bg-white border"}`}>
                <input type="radio" name="role" value="tecnico" checked={form.role === "tecnico"} onChange={onChange} className="hidden" />
                <span>Técnico</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-400 text-white font-medium shadow"
            >
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Check className="w-4 h-4" />}
              <span>{loading ? "Creando cuenta..." : "Registrarme"}</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-2">
            ¿Ya tienes cuenta? <Link to="/auth/login" className="text-teal-600 hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
