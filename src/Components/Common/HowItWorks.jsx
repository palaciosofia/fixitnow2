import { Search, Calendar, Wrench, Star, ArrowRight, Sparkles, CheckCircle, Zap } from "lucide-react";
import SectionTitle from "../SectionTitle/SectionTitle";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";

export default function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [activeStep, setActiveStep] = useState(0);
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
    <section className="bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-20 relative overflow-hidden">
      {/* Fondo animado con gradientes suaves */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        ></motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
            4 Pasos Simples
          </h2>
          <p className="text-xl text-emerald-700 max-w-2xl mx-auto">
            De búsqueda a solución en minutos
          </p>
        </motion.div>

        {/* Contenedor principal con dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* Columna izquierda - Pasos interactivos verticales */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveStep(index)}
                className="cursor-pointer"
              >
                <motion.div
                  className={`relative pl-20 py-6 px-6 rounded-2xl transition-all duration-300 ${
                    activeStep === index
                      ? 'bg-gradient-to-r from-emerald-500/40 to-teal-500/30 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20'
                      : 'bg-white/60 border-2 border-white/40 hover:bg-white/80'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Número circular */}
                  <motion.div 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center font-black text-lg transition-all duration-300 ${
                      activeStep === index
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/50'
                        : 'bg-white/10 text-emerald-300 border-2 border-white/20'
                    }`}
                    animate={activeStep === index ? { scale: 1.1 } : { scale: 1 }}
                  >
                    {step.id}
                  </motion.div>

                  {/* Contenido */}
                  <div>
                    <motion.h3 
                      className={`text-2xl font-black mb-2 transition-colors duration-300 ${
                        activeStep === index ? 'text-emerald-700' : 'text-gray-800'
                      }`}
                      animate={activeStep === index ? { letterSpacing: '0.05em' } : {}}
                    >
                      {step.title}
                    </motion.h3>
                    <motion.p 
                      className={`transition-all duration-300 ${
                        activeStep === index ? 'text-gray-700 opacity-100' : 'text-gray-600 opacity-90'
                      }`}
                    >
                      {step.description}
                    </motion.p>
                  </div>

                  {/* Línea conectora */}
                  {index < steps.length - 1 && (
                    <motion.div 
                      className="absolute left-7 top-full w-1 h-8 bg-gradient-to-b from-white/30 to-transparent"
                      animate={activeStep === index ? { opacity: 1 } : { opacity: 0.5 }}
                    ></motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Columna derecha - Visualización dinámica */}
          <div className="relative">
            <motion.div
              className="sticky top-20 h-[500px] bg-gradient-to-br from-white/60 to-white/40 rounded-3xl border-2 border-white/60 backdrop-blur-xl p-8 flex flex-col items-center justify-center overflow-hidden shadow-xl"
              whileHover={{ borderColor: 'rgba(16, 185, 129, 0.6)' }}
            >
              {/* Fondo animado del preview */}
              <motion.div
                className="absolute inset-0 rounded-3xl opacity-20"
                animate={{
                  background: [
                    'linear-gradient(45deg, #10b981, #14b8a6)',
                    'linear-gradient(225deg, #0891b2, #06b6d4)',
                    'linear-gradient(45deg, #10b981, #14b8a6)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              ></motion.div>

              {/* Contenido del preview */}
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
                className="relative z-10 text-center"
              >
                {/* Icono grande y animado */}
                <motion.div
                  className={`w-32 h-32 mx-auto mb-8 rounded-3xl flex items-center justify-center text-white text-5xl shadow-2xl transform`}
                  style={{
                    background: `linear-gradient(135deg, ${
                      [
                        '#10b981',
                        '#3b82f6',
                        '#a855f7',
                        '#f97316'
                      ][activeStep]
                    }, ${
                      [
                        '#14b8a6',
                        '#0ea5e9',
                        '#d946ef',
                        '#ea580c'
                      ][activeStep]
                    })`
                  }}
                  animate={{
                    rotateY: [0, 360],
                    boxShadow: [
                      `0 0 30px ${['rgba(16, 185, 129, 0.5)', 'rgba(59, 130, 246, 0.5)', 'rgba(168, 85, 247, 0.5)', 'rgba(249, 115, 22, 0.5)'][activeStep]}`,
                      `0 0 60px ${['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(249, 115, 22, 0.8)'][activeStep]}`,
                      `0 0 30px ${['rgba(16, 185, 129, 0.5)', 'rgba(59, 130, 246, 0.5)', 'rgba(168, 85, 247, 0.5)', 'rgba(249, 115, 22, 0.5)'][activeStep]}`
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {[<Search key="1" />, <Calendar key="2" />, <Wrench key="3" />, <Star key="4" />][activeStep]}
                </motion.div>

                {/* Título y descripción */}
                <h3 className="text-3xl font-black text-gray-900 mb-3">
                  {steps[activeStep].title}
                </h3>
                <p className="text-lg text-gray-700 mb-8 max-w-xs">
                  {steps[activeStep].description}
                </p>

                {/* Indicadores de progreso */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className="h-2 rounded-full bg-white/20"
                      animate={{
                        width: activeStep === index ? 24 : 8,
                        backgroundColor: activeStep === index ? '#10b981' : 'rgba(255, 255, 255, 0.2)'
                      }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  ))}
                </div>

                {/* Paso actual */}
                <div className="text-sm text-emerald-700 font-semibold">
                  Paso {activeStep + 1} de {steps.length}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* CTA final mejorado */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.a 
            href="/#catalogo"
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl rounded-2xl shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></motion.div>
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative z-10"
            >
              <Search className="w-6 h-6" />
            </motion.div>
            <span className="relative z-10">Explorar Técnicos Ahora</span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
              className="relative z-10"
            >
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
