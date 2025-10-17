// src/Pages/Auth/Forgot/Forgot.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { sendReset } from "../../../services/auth";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr("Correo inválido.");
      return;
    }

    try {
      setLoading(true);
      await sendReset(email);
      setMsg("Te enviamos un correo con el enlace para restablecer tu contraseña.");
      setEmail("");
    } catch (e) {
      setErr("No pudimos enviar el correo. Verifica el email o intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Restablecer contraseña</h1>
      <p className="text-sm text-gray-600 mb-4">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm mb-1">Correo</label>
          <input
            id="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-black/30"
            required
          />
        </div>

        {msg && <div className="text-green-700 text-sm">{msg}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <Link to="/auth/login" className="text-sm underline text-gray-700 hover:text-black">
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
