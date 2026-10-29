// src/Pages/NoAutorizado.jsx
import { ShieldAlert } from "lucide-react";
import { Button } from "../ui";

export default function NoAutorizado() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warn-soft text-warn">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold">No tienes acceso a esta sección</h1>
        <p className="mt-2 text-sm text-muted">
          Esta página es para otro tipo de cuenta. Si crees que es un error, cierra sesión y vuelve a entrar.
        </p>
        <div className="mt-6 flex justify-center">
          <Button to="/">Volver al inicio</Button>
        </div>
      </div>
    </div>
  );
}
