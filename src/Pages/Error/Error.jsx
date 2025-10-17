import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

const Error = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto w-24 h-24 grid place-items-center rounded-full bg-red-50 mb-4">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-sm text-gray-500 mb-6">
          Lo sentimos — la página que buscas no existe o fue movida. Verifica la URL o vuelve al inicio.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            Ir al inicio
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-block px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error;