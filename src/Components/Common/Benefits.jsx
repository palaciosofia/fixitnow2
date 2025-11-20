import { CheckCircle, ShieldCheck, CreditCard, Star, Truck, Home, Tag, Sparkles, ArrowRight, Shield, Users, Clock, Award, Zap, Heart, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import SectionTitle from "../SectionTitle/SectionTitle";
import heroImg1 from "../../assets/Hero/hero_1.png";

export default function Benefits() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const stats = [
    {
      id: 1,
      number: 500,
      label: "Técnicos Verificados",
      icon: Users,
      color: "emerald",
      suffix: "+"
    },
    {
      id: 2,
      number: 10000,
      label: "Servicios Completados",
      icon: CheckCircle,
      color: "blue",
      suffix: "+"
    },
    {
      id: 3,
      number: 4.9,
      label: "Calificación Promedio",
      icon: Star,
      color: "yellow",
      suffix: "★",
      decimals: 1
    },
    {
      id: 4,
      number: 24,
      label: "Soporte Disponible",
      icon: Clock,
      color: "purple",
      suffix: "/7"
    },
  ];

  const features = [
    {
      id: 1,
      title: "Técnicos Verificados",
      description: "Perfiles revisados y certificados con experiencia comprobada para tu total tranquilidad.",
      icon: ShieldCheck,
      color: "emerald"
    },
    {
      id: 2,
      title: "Respuesta Inmediata",
      description: "Atención al cliente 24/7 con respuesta inmediata cuando más lo necesitas.",
      icon: Zap,
      color: "blue"
    },
    {
      id: 3,
      title: "Garantía Total",
      description: "Respaldo completo en todos los servicios con políticas de satisfacción garantizada.",
      icon: Shield,
      color: "purple"
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      emerald: {
        bg: "from-emerald-500 to-teal-600",
        text: "from-emerald-600 to-teal-600",
        light: "bg-emerald-50",
        border: "border-emerald-200"
      },
      blue: {
        bg: "from-blue-500 to-cyan-600", 
        text: "from-blue-600 to-cyan-600",
        light: "bg-blue-50",
        border: "border-blue-200"
      },
      yellow: {
        bg: "from-yellow-500 to-orange-500",
        text: "from-yellow-600 to-orange-600",
        light: "bg-yellow-50",
        border: "border-yellow-200"
      },
      purple: {
        bg: "from-purple-500 to-violet-600",
        text: "from-purple-600 to-violet-600", 
        light: "bg-purple-50",
        border: "border-purple-200"
      }
    };
    return colorMap[color] || colorMap.emerald;
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10" ref={ref}>
        
        {/* Sección principal con imagen y estadísticas */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="grid lg:grid-cols-2 gap-16 items-center mb-20"
        >
          
          {/* Contenido de texto y estadísticas */}
          <div className="space-y-8">
            {/* Título principal */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-emerald-600 uppercase tracking-wider">Los Números No Mienten</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-gray-900"
              >
                Notables{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  logros
                </span>{" "}
                y{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  estadísticas
                </span>{" "}
                de nuestra plataforma de servicios técnicos.
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-xl text-gray-600 leading-relaxed max-w-2xl"
              >
                Hitos y resultados destacados de nuestra experiencia conectando clientes con técnicos profesionales de confianza.
              </motion.p>
            </div>

            {/* Estadísticas animadas */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const colors = getColorClasses(stat.color);
                
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    className={`${colors.light} ${colors.border} border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${colors.bg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${colors.text} bg-clip-text text-transparent`}>
                          {inView ? (
                            <CountUp
                              end={stat.number}
                              duration={2.5}
                              delay={0.5}
                              suffix={stat.suffix}
                              decimals={stat.decimals || 0}
                              preserveValue
                            />
                          ) : (
                            "0" + stat.suffix
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-600 leading-tight">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Características principales */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="space-y-4"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colors = getColorClasses(feature.color);
                
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-r ${colors.bg} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 mt-1`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Botón CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <a
                href="/tecnicos"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 group"
              >
                Conoce Más
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>

          {/* Imagen profesional */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: 5 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Elementos decorativos alrededor de la imagen */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl scale-110"></div>
            <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-400/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-400/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
            
            {/* Badge circular animado */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-10 left-10 w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-20 shadow-xl"
            >
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs">Creciendo</div>
              </div>
            </motion.div>
            
            {/* Imagen principal */}
            <div className="relative z-10">
              <img 
                src={heroImg1} 
                alt="Técnico profesional verificado"
                className="w-full max-w-md mx-auto rounded-full border-8 border-white/50 shadow-2xl hover:border-white/80 transition-all duration-500 transform hover:scale-105"
              />
              
              {/* Badge de verificación */}
              <div className="absolute bottom-8 right-8 bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl z-30">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-bold">Verificado</span>
              </div>
              
              {/* Mini badges flotantes */}
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-gray-700">4.9</span>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-32 left-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-gray-700">98%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="text-center"
        >
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
                href="/tecnicos"
                className="inline-flex items-center gap-4 px-8 py-4 bg-white text-emerald-600 font-black text-lg rounded-2xl shadow-lg hover:shadow-emerald-500/25 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="w-6 h-6" />
                Explorar Servicios Premium
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
