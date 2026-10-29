// src/Pages/NoAutorizado.jsx
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function NoAutorizado() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No tienes acceso a esta sección</h1>
        <p className="text-gray-600 mb-6">
          Esta página es para otro tipo de cuenta. Si crees que es un error, cierra sesión y
          vuelve a entrar.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
