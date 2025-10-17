import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { MoveRight, ChevronLeft, ChevronRight, Percent, Truck, Clock, Shield, Sparkles, Star, Zap, Heart } from "lucide-react";
import { useRef, useState } from "react";
import bannerImg from "../../assets/Banner/banner_image.png";

export default function Hero() {
  const slides = [
    {
      id: 0,
      title: "Transformamos tu Hogar en un Paraíso",
      subTitle: "Servicios Premium a tu Alcance",
      description: "Descubre ofertas exclusivas en servicios de alta calidad. Técnicos expertos verificados te esperan.",
      image: bannerImg,
      buttonText: "Ver Ofertas Exclusivas",
      link: "/#ofertas",
      chips: ["🔥 Oferta Especial", "⏰ Tiempo Limitado"],
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      accentColor: "emerald"
    },
    {
      id: 1,
      title: "Arreglos del Hogar Sin Complicaciones",
      subTitle: "Tu Solución Está Aquí",
      description: "Encuentra técnicos profesionales verificados en tu zona. Reparaciones rápidas, seguras y garantizadas.",
      image: "/src/assets/Hero/hero_1.png",
      buttonText: "Explorar Técnicos",
      link: "/#catalogo",
      chips: ["⚡ Electricidad", "🔧 Plomería"],
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      accentColor: "emerald"
    },
    {
      id: 2,
      title: "Profesionales de Confianza a tu Servicio",
      subTitle: "Calidad Garantizada",
      description: "Agenda en minutos con nuestros expertos. Electricistas, plomeros y más especialistas esperándote.",
      image: "/src/assets/Hero/hero_2.png",
      buttonText: "Ver Todos los Servicios",
      link: "/#servicios",
      chips: ["🚀 Express", "🛡️ Garantía Total"],
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      accentColor: "emerald"
    },
  ];

  const sliderRef = useRef(null);
  const [active, setActive] = useState(0);

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    arrows: false,
    pauseOnHover: true,
    fade: true,
    cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    afterChange: (idx) => setActive(idx),
  };

  const PrevButton = () => (
    <button
      aria-label="Anterior"
      onClick={() => sliderRef.current?.slickPrev()}
      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 group"
    >
      <ChevronLeft size={24} className="text-gray-700 group-hover:text-emerald-600 transition-colors" />
    </button>
  );

  const NextButton = () => (
    <button
      aria-label="Siguiente"
      onClick={() => sliderRef.current?.slickNext()}
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 group"
    >
      <ChevronRight size={24} className="text-gray-700 group-hover:text-emerald-600 transition-colors" />
    </button>
  );

  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative">
        <PrevButton />
        <NextButton />

        <Slider ref={sliderRef} {...settings}>
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative">
              <div className={`min-h-screen bg-gradient-to-br ${slide.gradient} relative overflow-hidden`}>
                
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-bounce delay-500"></div>
                  <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
                </div>

                {/* Patrón de puntos decorativo */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-10 left-10 grid grid-cols-12 gap-6">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white/40"></div>
                    ))}
                  </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                  <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
                    
                    {/* Contenido del texto */}
                    <div className="space-y-8 text-white lg:pr-8">
                      
                      {/* Badges superiores */}
                      <div className="flex flex-wrap items-center gap-3">
                        {slide.chips?.map((chip, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-sm font-semibold shadow-lg hover:bg-white/30 transition-all duration-300"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      {/* Subtítulo con icono */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                          <Sparkles className="w-6 h-6 text-yellow-300" />
                        </div>
                        <p className="text-lg md:text-xl text-white/90 uppercase font-bold tracking-wider">
                          {slide.subTitle}
                        </p>
                      </div>

                      {/* Título principal espectacular */}
                      <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                          {slide.title?.split(' ').map((word, i) => (
                            <span 
                              key={i} 
                              className={`inline-block mr-4 ${i % 2 === 0 ? 'text-white' : 'text-yellow-300'} drop-shadow-lg`}
                              style={{
                                animationDelay: `${idx * 200 + i * 150}ms`,
                                animation: 'fadeInUp 0.8s ease-out forwards'
                              }}
                            >
                              {word}
                            </span>
                          ))}
                        </h1>
                        
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                          {slide.description}
                        </p>
                      </div>

                      {/* Estadísticas rápidas */}
                      <div className="flex flex-wrap gap-6 text-white/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-900" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">500+</div>
                            <div className="text-sm text-white/70">Técnicos Expertos</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-400 rounded-2xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-green-900" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">24/7</div>
                            <div className="text-sm text-white/70">Disponibilidad</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-400 rounded-2xl flex items-center justify-center">
                            <Heart className="w-5 h-5 text-pink-900" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">98%</div>
                            <div className="text-sm text-white/70">Satisfacción</div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción espectaculares */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <a
                          href={slide.link}
                          className="group relative px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            {slide.buttonText}
                            <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                        
                        <a
                          href="/#contact"
                          className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                        >
                          Contactar Ahora
                        </a>
                      </div>
                    </div>

                    {/* Imagen mejorada */}
                    <div className="relative lg:pl-8">
                      <div className="relative z-10 transform hover:scale-105 transition-all duration-700">
                        
                        {/* Fondo decorativo para la imagen */}
                        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl scale-110"></div>
                        
                        <img
                          src={slide.image}
                          alt={slide.title}
                          loading="lazy"
                          className="relative z-10 w-full h-auto max-w-2xl mx-auto drop-shadow-2xl rounded-3xl"
                          style={{
                            animationDelay: `${idx * 200 + 600}ms`,
                            animation: 'fadeInRight 0.8s ease-out forwards'
                          }}
                        />
                      </div>
                      
                      {/* Elementos flotantes alrededor de la imagen */}
                      <div className="absolute top-16 -left-8 w-24 h-24 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float">
                        <span className="text-3xl">🔧</span>
                      </div>
                      <div className="absolute bottom-24 -right-8 w-28 h-28 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float delay-1000">
                        <span className="text-4xl">⚡</span>
                      </div>
                      <div className="absolute top-1/2 -right-12 w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float delay-500">
                        <span className="text-2xl">🛠️</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* Indicadores de navegación premium */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-3 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => sliderRef.current?.slickGoTo(i)}
              className={`transition-all duration-500 rounded-full ${
                active === i
                  ? "w-12 h-3 bg-white shadow-lg"
                  : "w-3 h-3 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Tarjeta de beneficios espectacular */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-80px] w-full max-w-6xl px-4 z-40">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 py-8 px-8 relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-2xl opacity-40"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <Feature 
                icon={<Percent className="w-6 h-6" />} 
                title="Descuentos Exclusivos" 
                text="Promociones especiales" 
                color="emerald"
              />
              <Feature 
                icon={<Truck className="w-6 h-6" />} 
                title="Servicio Express" 
                text="Atención inmediata" 
                color="blue"
              />
              <Feature 
                icon={<Clock className="w-6 h-6" />} 
                title="Soporte 24/7" 
                text="Siempre disponibles" 
                color="purple"
              />
              <Feature 
                icon={<Shield className="w-6 h-6" />} 
                title="Garantía Total" 
                text="Calidad asegurada" 
                color="orange"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

function Feature({ icon, title, text, color = "emerald" }) {
  const colorVariants = {
    emerald: "from-emerald-500 to-teal-600 text-emerald-700",
    blue: "from-blue-500 to-cyan-600 text-blue-700", 
    purple: "from-purple-500 to-violet-600 text-purple-700",
    orange: "from-orange-500 to-red-600 text-orange-700"
  };

  return (
    <div className="group flex items-center gap-4 text-gray-700 hover:scale-105 transition-all duration-300">
      <div className={`w-14 h-14 bg-gradient-to-br ${colorVariants[color]} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{title}</p>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{text}</p>
      </div>
    </div>
  );
}
