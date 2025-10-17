import { Search, Calendar, Wrench, Truck } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          ¿Cómo funciona?
        </h2>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          Sigue estos pasos sencillos para reservar un servicio con técnicos
          cercanos.
        </p>
      </div>

      {/* Grid de tarjetas (sin imágenes, solo iconos) */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <Search className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Explora técnicos</h3>
          <p className="text-sm text-gray-500 mt-2">
            Busca por ciudad y especialidad para encontrar perfiles verificados.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <Calendar className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Elige fecha</h3>
          <p className="text-sm text-gray-500 mt-2">
            Selecciona día y hora que mejor te convengan y confirma la solicitud.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <Wrench className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Recibe el servicio</h3>
          <p className="text-sm text-gray-500 mt-2">
            El técnico llega, realiza el trabajo y puedes revisar el resultado.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <Truck className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Califica y listo</h3>
          <p className="text-sm text-gray-500 mt-2">
            Valora el servicio para ayudar a otros usuarios y mejorar la
            plataforma.
          </p>
        </div>
      </div>
    </section>
  );
}
