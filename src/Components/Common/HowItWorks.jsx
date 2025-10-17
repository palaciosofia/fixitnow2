import { Search, Calendar, Wrench, Star, ArrowRight, Sparkles } from "lucide-react";
import SectionTitle from "../SectionTitle/SectionTitle";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      icon: <Search className="w-8 h-8" />,
      title: "Explora Técnicos",
      description: "Busca por ciudad y especialidad para encontrar perfiles verificados con excelentes calificaciones.",
      gradient: "from-emerald-500 to-teal-600",
      bgColor: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200"
    },
    {
      id: 2,
      icon: <Calendar className="w-8 h-8" />,
      title: "Elige Fecha y Hora",
      description: "Selecciona el día y horario que mejor te convengan. Sistema de reservas flexible y fácil.",
      gradient: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50", 
      borderColor: "border-blue-200"
    },
    {
      id: 3,
      icon: <Wrench className="w-8 h-8" />,
      title: "Recibe el Servicio",
      description: "El técnico llega puntual, realiza el trabajo con calidad profesional y garantía incluida.",
      gradient: "from-purple-500 to-violet-600",
      bgColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200"
    },
    {
      id: 4,
      icon: <Star className="w-8 h-8" />,
      title: "Califica y Listo",
      description: "Valora el servicio para ayudar a otros usuarios. Tu opinión mejora nuestra plataforma.",
      gradient: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50",
      borderColor: "border-orange-200"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header espectacular con SectionTitle */}
        <div className="mb-16">
          <SectionTitle 
            title="¿Cómo Funciona?" 
            subtitle="Proceso simple y rápido para conectarte con técnicos expertos"
            variant="hero"
            icon="sparkles"
            textAlign="center"
            mb="mb-0"
          />
        </div>

        {/* Grid de pasos con conexiones */}
        <div className="relative">
          {/* Línea conectora para desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-orange-500 rounded-full opacity-30"></div>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className="group relative animate-fade-in-up"
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                {/* Card principal */}
                <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 ${step.borderColor} p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden`}>
                  
                  {/* Decoración de fondo */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${step.bgColor} rounded-full blur-2xl opacity-60`}></div>
                  
                  {/* Número del paso */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-black">{step.id}</span>
                  </div>

                  {/* Icono principal */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10`}>
                    {step.icon}
                  </div>

                  {/* Contenido */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {step.description}
                    </p>
                  </div>

                  {/* Flecha conectora */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 inline-block">
            <div className="flex items-center gap-4 justify-center mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              <h3 className="text-2xl font-black text-gray-900">¡Comienza Ahora!</h3>
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Miles de técnicos verificados están listos para ayudarte. 
              Tu solución está a solo unos clics de distancia.
            </p>
            <a 
              href="/#catalogo"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Search className="w-6 h-6" />
              Explorar Técnicos
              <ArrowRight className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
