// src/Pages/Error/Error.jsx
import { SearchX } from "lucide-react";
import { Button } from "../../ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted">La página que buscas no existe o cambió de dirección.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button to="/">Ir al inicio</Button>
          <Button to="/tecnicos" variant="secondary">Ver técnicos</Button>
        </div>
      </div>
    </div>
  );
}
