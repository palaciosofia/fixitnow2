// src/Pages/Auth/Forgot/Forgot.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { sendReset } from "../../../services/auth";
import { Alert, Button, Field, Input, Logo } from "../../../ui";

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
    } catch {
      setErr("No pudimos enviar el correo. Verifica el email o intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <main className="w-full max-w-[420px] rounded-[20px] border border-line bg-white p-6 sm:p-8">
        <Logo compact />
        <h1 className="mt-5 text-[26px] font-semibold">Restablecer contraseña</h1>
        <p className="mt-1.5 text-sm text-muted">Te enviamos un enlace a tu correo para crear una nueva.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
          <Field label="Correo electrónico">
            {(id) => (
              <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
            )}
          </Field>
          {err && <Alert tone="danger">{err}</Alert>}
          {msg && <Alert tone="success">{msg}</Alert>}
          <Button type="submit" size="lg" loading={loading}>Enviar enlace</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/auth/login" className="font-medium text-brand-ink hover:underline">Volver a iniciar sesión</Link>
        </p>
      </main>
    </div>
  );
}
