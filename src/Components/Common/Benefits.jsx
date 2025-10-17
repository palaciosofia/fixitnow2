import { CheckCircle, ShieldCheck, CreditCard, Star, Truck, Home, Tag, Sparkles, ArrowRight, Shield } from "lucide-react";
import SectionTitle from "../SectionTitle/SectionTitle";

export default function Benefits() {
  const items = [
    { 
      id: 1, 
      title: "Técnicos Verificados", 
      desc: "Perfiles revisados y certificados con experiencia comprobada para tu total tranquilidad.", 
      icon: ShieldCheck, 
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      shadowColor: "shadow-emerald-500/25"
    },
    { 
      id: 2, 
      title: "Tiendas Especializadas", 
      desc: "Red curada de tiendas profesionales con servicios de alta calidad y garantía.", 
      icon: Home, 
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      shadowColor: "shadow-blue-500/25"
    },
    { 
      id: 3, 
      title: "Pago 100% Seguro", 
      desc: "Múltiples métodos de pago con cifrado bancario y protección total de tus datos.", 
      icon: CreditCard, 
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-50",
      shadowColor: "shadow-purple-500/25"
    },
    { 
      id: 4, 
      title: "Productos Premium", 
      desc: "Selección exclusiva de productos y servicios destacados por calidad superior.", 
      icon: Tag, 
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50",
      shadowColor: "shadow-orange-500/25"
    },
    { 
      id: 5, 
      title: "Soporte Instantáneo", 
      desc: "Atención al cliente 24/7 con respuesta inmediata cuando más lo necesitas.", 
      icon: Truck, 
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-50 to-rose-50",
      shadowColor: "shadow-pink-500/25"
    },
    { 
      id: 6, 
      title: "Garantía Total", 
      desc: "Respaldo completo en todos los servicios con políticas de satisfacción garantizada.", 
      icon: Star, 
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
      shadowColor: "shadow-indigo-500/25"
    },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header*/}
        <div className="mb-16">
          <SectionTitle 
            title="¿Por Qué Elegirnos?" 
            subtitle="Calidad premium, seguridad garantizada y la mejor experiencia en servicios técnicos"
            variant="hero"
            icon="star"
            textAlign="center"
            mb="mb-0"
          />
        </div>

        {/* Grid premium de beneficios */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-12">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                {/* Decoración de fondo */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.bgGradient} rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-300`}></div>
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>

                {/* Icono principal */}
                <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10`}>
                  <Icon className="w-8 h-8" />
                </div>

                {/* Contenido */}
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {item.desc}
                  </p>
                </div>

                {/* Brillo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Estadísticas premium */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-teal-700 transition-all duration-300">
                10,000+
              </div>
              <p className="text-gray-600 font-medium mt-2">Técnicos Activos</p>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700 transition-all duration-300">
                50,000+
              </div>
              <p className="text-gray-600 font-medium mt-2">Servicios Completados</p>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-violet-700 transition-all duration-300">
                4.9★
              </div>
              <p className="text-gray-600 font-medium mt-2">Calificación Promedio</p>
            </div>
            <div className="group">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-red-700 transition-all duration-300">
                24/7
              </div>
              <p className="text-gray-600 font-medium mt-2">Soporte Disponible</p>
            </div>
          </div>
        </div>

        {/* CTA final espectacular */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Sparkles className="w-8 h-8 text-emerald-200" />
                <h3 className="text-2xl md:text-3xl font-black">¡Comienza Tu Experiencia Premium!</h3>
                <Sparkles className="w-8 h-8 text-emerald-200" />
              </div>
              
              <p className="text-emerald-100 mb-8 text-lg max-w-2xl mx-auto">
                Únete a miles de usuarios que ya disfrutan de servicios técnicos de calidad superior. 
                Tu hogar merece lo mejor.
              </p>
              
              <a 
                href="/#catalogo"
                className="inline-flex items-center gap-4 px-8 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-lg hover:shadow-emerald-500/25 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="w-6 h-6" />
                Explorar Servicios Premium
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
