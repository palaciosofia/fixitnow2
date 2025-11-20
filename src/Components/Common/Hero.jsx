import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { MoveRight, ChevronLeft, ChevronRight, Shield, Sparkles, Star, Zap, Heart, ArrowRight, CheckCircle, Users, Clock, Award } from "lucide-react";
import { useRef, useState } from "react";
import heroImg1 from "../../assets/Hero/hero_1.png";
import heroImg2 from "../../assets/Hero/hero_2.png";

export default function Hero() {
  const slides = [
    {
      id: 0,
      title: "Arreglos del Hogar Sin Complicaciones",
      subTitle: "Tu Solución Está Aquí",
      description: "Encuentra técnicos profesionales verificados en tu zona. Reparaciones rápidas, seguras y garantizadas.",
      image: heroImg1,
      buttonText: "Explorar Técnicos",
      link: "/tecnicos",
      chips: ["⚡ Electricidad", "🔧 Plomería"]
    },
    {
      id: 1,
      title: "Profesionales de Confianza a tu Servicio", 
      subTitle: "Calidad Garantizada",
      description: "Agenda en minutos con nuestros expertos. Electricistas, plomeros y más especialistas esperándote.",
      image: heroImg2,
      buttonText: "Ver Todos los Servicios",
      link: "/tecnicos",
      chips: ["🚀 Express", "🛡️ Garantía Total"]
    },
    {
      id: 2,
      title: "Transformamos tu Hogar en un Paraíso",
      subTitle: "Servicios Premium a tu Alcance", 
      description: "Descubre ofertas exclusivas en servicios de alta calidad. Técnicos expertos verificados te esperan.",
      image: heroImg1,
      buttonText: "Ver Ofertas Exclusivas",
      link: "/tecnicos",
      chips: ["🔥 Oferta Especial", "⏰ Tiempo Limitado"]
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
      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30 flex items-center justify-center hover:scale-110 hover:bg-white/30 transition-all duration-500 group hover:shadow-white/20"
    >
      <ChevronLeft size={24} className="text-white group-hover:text-white/90 transition-colors" />
    </button>
  );

  const NextButton = () => (
    <button
      aria-label="Siguiente"
      onClick={() => sliderRef.current?.slickNext()}
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30 flex items-center justify-center hover:scale-110 hover:bg-white/30 transition-all duration-500 group hover:shadow-white/20"
    >
      <ChevronRight size={24} className="text-white group-hover:text-white/90 transition-colors" />
    </button>
  );

  return (
    <section className="w-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden min-h-screen">
      {/* Elementos decorativos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Patrón de puntos decorativo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 grid grid-cols-6 gap-4">
          {Array.from({length: 24}).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: `${i * 100}ms`}}></div>
          ))}
        </div>
      </div>
      <div className="relative">
        <PrevButton />
        <NextButton />

        <Slider ref={sliderRef} {...settings}>
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative">
              <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                  <div className="grid lg:grid-cols-2 gap-12 items-center py-20 min-h-[70vh]">
                    
                    {/* Contenido del texto */}
                    <div className="space-y-8 text-white lg:pr-8 animate-fade-in-up">
                      
                      {/* Badges superiores con mejor diseño */}
                      <div className="flex flex-wrap items-center gap-3">
                        {slide.chips?.map((chip, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/25 backdrop-blur-xl rounded-full border border-white/40 text-sm font-bold text-white shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white/35"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      {/* Subtítulo con icono mejorado */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30">
                          <Sparkles className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <p className="text-xl text-white/95 uppercase font-black tracking-wider">
                          {slide.subTitle}
                        </p>
                      </div>

                      {/* Título principal mejorado */}
                      <div className="space-y-6">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] drop-shadow-2xl bg-gradient-to-r from-white via-white to-cyan-100 bg-clip-text text-transparent">
                          {slide.title}
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed font-medium">
                          {slide.description}
                        </p>
                      </div>

                      {/* Estadísticas mejoradas */}
                      <div className="flex flex-wrap gap-8 py-4">
                        <div className="flex items-center gap-4 bg-white/15 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/25 hover:scale-105 transition-all duration-300">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">500+</div>
                            <div className="text-sm text-white/80 font-semibold">Técnicos</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/15 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/25 hover:scale-105 transition-all duration-300">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">24/7</div>
                            <div className="text-sm text-white/80 font-semibold">Disponible</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/15 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/25 hover:scale-105 transition-all duration-300">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-black text-white">98%</div>
                            <div className="text-sm text-white/80 font-semibold">Satisfacción</div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción mejorados */}
                      <div className="flex flex-col sm:flex-row gap-6 pt-6">
                        <a
                          href={slide.link}
                          className="group relative px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-lg shadow-2xl hover:shadow-white/25 transition-all duration-500 transform hover:scale-110 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative flex items-center justify-center gap-3">
                            {slide.buttonText}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                          </span>
                        </a>
                        
                        <a
                          href="/tecnicos"
                          className="px-10 py-5 border-2 border-white/40 text-white rounded-2xl font-bold text-lg backdrop-blur-xl hover:bg-white/15 hover:border-white/60 transition-all duration-500 hover:scale-105 hover:shadow-xl"
                        >
                          Contactar Ahora
                        </a>
                      </div>
                    </div>

                    {/* Imagen mejorada */}
                    <div className="relative lg:pl-8">
                      {/* Elementos decorativos alrededor de la imagen */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl blur-3xl"></div>
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
                      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
                      
                      <div className="relative z-10 transform hover:scale-105 transition-all duration-700">
                        <img 
                          src={slide.image} 
                          alt={slide.title} 
                          loading="lazy"
                          className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-3xl border-4 border-white/20 hover:border-white/40 transition-all duration-500"
                        />
                        
                        {/* Badge de verificación */}
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-bold">Verificado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* Indicadores de navegación mejorados */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-4 z-30 bg-white/20 backdrop-blur-xl rounded-full px-6 py-3 border border-white/30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => sliderRef.current?.slickGoTo(i)}
              className={`transition-all duration-500 rounded-full ${
                active === i
                  ? "w-12 h-4 bg-white shadow-lg scale-110"
                  : "w-4 h-4 bg-white/60 hover:bg-white/80 hover:scale-110"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}