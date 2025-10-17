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
      chips: ["🔥 Oferta Especial", "⏰ Tiempo Limitado"]
    },
    {
      id: 1,
      title: "Arreglos del Hogar Sin Complicaciones",
      subTitle: "Tu Solución Está Aquí",
      description: "Encuentra técnicos profesionales verificados en tu zona. Reparaciones rápidas, seguras y garantizadas.",
      image: "/src/assets/Hero/hero_1.png",
      buttonText: "Explorar Técnicos",
      link: "/#catalogo",
      chips: ["⚡ Electricidad", "🔧 Plomería"]
    },
    {
      id: 2,
      title: "Profesionales de Confianza a tu Servicio",
      subTitle: "Calidad Garantizada",
      description: "Agenda en minutos con nuestros expertos. Electricistas, plomeros y más especialistas esperándote.",
      image: "/src/assets/Hero/hero_2.png",
      buttonText: "Ver Todos los Servicios",
      link: "/#servicios",
      chips: ["🚀 Express", "🛡️ Garantía Total"]
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
      className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 group"
    >
      <ChevronLeft size={20} className="text-gray-700 group-hover:text-emerald-600 transition-colors" />
    </button>
  );

  const NextButton = () => (
    <button
      aria-label="Siguiente"
      onClick={() => sliderRef.current?.slickNext()}
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center hover:scale-110 hover:bg-white transition-all duration-300 group"
    >
      <ChevronRight size={20} className="text-gray-700 group-hover:text-emerald-600 transition-colors" />
    </button>
  );

  return (
    <section className="w-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
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
                    <div className="space-y-6 text-white lg:pr-8">
                      
                      {/* Badges superiores */}
                      <div className="flex flex-wrap items-center gap-3">
                        {slide.chips?.map((chip, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-sm font-semibold"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      {/* Subtítulo con icono */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                          <Sparkles className="w-5 h-5 text-yellow-300" />
                        </div>
                        <p className="text-lg text-white/90 uppercase font-bold tracking-wider">
                          {slide.subTitle}
                        </p>
                      </div>

                      {/* Título principal */}
                      <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white drop-shadow-lg">
                          {slide.title}
                        </h1>
                        
                        <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                          {slide.description}
                        </p>
                      </div>

                      {/* Estadísticas rápidas */}
                      <div className="flex flex-wrap gap-6 text-white/80">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center">
                            <Star className="w-4 h-4 text-yellow-900" />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">500+</div>
                            <div className="text-sm text-white/70">Técnicos</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-400 rounded-xl flex items-center justify-center">
                            <Zap className="w-4 h-4 text-green-900" />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">24/7</div>
                            <div className="text-sm text-white/70">Disponible</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-pink-400 rounded-xl flex items-center justify-center">
                            <Heart className="w-4 h-4 text-pink-900" />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">98%</div>
                            <div className="text-sm text-white/70">Satisfacción</div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <a
                          href={slide.link}
                          className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        >
                          <span className="flex items-center justify-center gap-3">
                            {slide.buttonText}
                            <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </a>
                        
                        <a
                          href="/#contact"
                          className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                        >
                          Contactar Ahora
                        </a>
                      </div>
                    </div>

                    {/* Imagen */}
                    <div className="relative lg:pl-8">
                      <div className="relative z-10">
                        <img 
                          src={slide.image} 
                          alt={slide.title} 
                          loading="lazy"
                          className="w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* Indicadores de navegación */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-3 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => sliderRef.current?.slickGoTo(i)}
              className={`transition-all duration-300 rounded-full ${
                active === i
                  ? "w-10 h-3 bg-white shadow-lg"
                  : "w-3 h-3 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>


      </div>
    </section>
  );
}

// Componente de tarjeta de beneficios separado
export function HeroBenefits() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">
              ¿Por qué elegir FixItNow?
            </h2>
            <p className="text-gray-600">Beneficios que nos hacen únicos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Feature 
              icon={<Percent className="w-6 h-6" />} 
              title="Descuentos Exclusivos" 
              text="Promociones especiales para clientes frecuentes" 
              color="emerald"
            />
            <Feature 
              icon={<Truck className="w-6 h-6" />} 
              title="Servicio Express" 
              text="Atención inmediata cuando más lo necesitas" 
              color="blue"
            />
            <Feature 
              icon={<Clock className="w-6 h-6" />} 
              title="Soporte 24/7" 
              text="Siempre disponibles para ayudarte" 
              color="purple"
            />
            <Feature 
              icon={<Shield className="w-6 h-6" />} 
              title="Garantía Total" 
              text="Calidad asegurada en cada servicio" 
              color="orange"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, text, color = "emerald" }) {
  const colorVariants = {
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-cyan-600", 
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-red-600"
  };

  return (
    <div className="group text-center hover:scale-105 transition-all duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br ${colorVariants[color]} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mx-auto mb-4`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors mb-2">{title}</p>
        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors leading-relaxed">{text}</p>
      </div>
    </div>
  );
}