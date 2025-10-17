import { CheckCircle, ShieldCheck, CreditCard, Star, Truck, Home, Tag } from "lucide-react";

export default function Benefits() {
  // items con variante para alternar estilos (white / green)
  const items = [
    { id: 1, title: "Técnicos verificados", desc: "Perfiles revisados y certificados para tu tranquilidad.", icon: CheckCircle, variant: "white" },
    { id: 2, title: "Tiendas especializadas", desc: "Selección de tiendas con servicios profesionales.", icon: Home, variant: "green" },
    { id: 3, title: "Pago seguro", desc: "Múltiples métodos y cifrado para tus transacciones.", icon: CreditCard, variant: "white" },
    { id: 4, title: "Productos destacados", desc: "Ofertas y productos seleccionados por calidad.", icon: Tag, variant: "green" },
    { id: 5, title: "Soporte 24/7", desc: "Ayuda rápida cuando la necesitas.", icon: Truck, variant: "white" },
    { id: 6, title: "Profesionales verificados", desc: "Controles de identidad y experiencia.", icon: ShieldCheck, variant: "green" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-8 py-14">
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Por qué elegirnos</h2>
        <p className="text-base text-gray-500 mt-3">Calidad, seguridad y rapidez en los servicios para tu hogar.</p>
      </div>

      {/* Grid de tarjetas largas (texto a la izquierda, icono a la derecha) */}
      <ul className="grid gap-8 grid-cols-1 md:grid-cols-2">
        {items.map((it) => {
          const Icon = it.icon;
          const green = it.variant === "green";
          return (
            <li
              key={it.id}
              className={`rounded-2xl ${green ? "bg-teal-100 text-teal-800" : "bg-white text-gray-900"} shadow-sm flex items-center justify-between p-6 h-36`}
            >
              <div className="flex-1 pr-6">
                <h3 className="text-lg font-semibold mb-2">{it.title}</h3>
                <p className="text-sm text-gray-600">{it.desc}</p>
              </div>

              <div className={`${green ? "bg-white" : "bg-teal-50"} w-16 h-16 rounded-md grid place-items-center border border-gray-100`}>
                <Icon className={`${green ? "text-teal-700" : "text-teal-600"} w-7 h-7`} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 text-center">
        <a href="/#servicios" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-teal-700 transition">
          Ver todos los servicios
        </a>
      </div>
    </section>
  );
}
