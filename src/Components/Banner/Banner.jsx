
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { MoveLeft, MoveRight, Sparkles, Star, Zap } from "lucide-react";

const Banner = () => {

    const products = [
        {
            id: 1,
            title: "Encuentra el Técnico Perfecto para Tu Hogar",
            subTitle: "Servicios de Confianza",
            description: "Conecta con profesionales verificados en tu ciudad. Reparaciones rápidas y confiables.",
            image: "/src/assets/Banner/banner_image.png",
            gradient: "from-emerald-600 via-teal-600 to-cyan-600",
            accent: "emerald"
        },
        {
            id: 2,
            title: "Reparaciones Profesionales al Instante",
            subTitle: "Disponible 24/7",
            description: "Técnicos calificados listos para resolver cualquier problema en tu hogar.",
            image: "/src/assets/Banner/banner_image.png",
            gradient: "from-blue-600 via-indigo-600 to-purple-600",
            accent: "blue"
        },
        {
            id: 3,
            title: "Calidad Garantizada en Cada Servicio",
            subTitle: "Satisfacción Total",
            description: "Miles de clientes satisfechos confían en nuestros técnicos especializados.",
            image: "/src/assets/Banner/banner_image.png",
            gradient: "from-orange-500 via-pink-500 to-red-500",
            accent: "orange"
        },
        {
            id: 4,
            title: "Reserva en Minutos, Resuelve Hoy",
            subTitle: "Proceso Simplificado",
            description: "Sistema intuitivo para conectar con el técnico ideal según tus necesidades.",
            image: "/src/assets/Banner/banner_image.png",
            gradient: "from-violet-600 via-purple-600 to-indigo-600",
            accent: "violet"
        },
    ]

    const settings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        pauseOnHover: true,
        fade: true,
        cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        customPaging: (i) => (
            <div className="w-3 h-3 rounded-full bg-white/40 hover:bg-white transition-all duration-300 mx-1"></div>
        ),
        dotsClass: "slick-dots !bottom-8 !flex !justify-center !gap-2",
    };

    return (
        <div className="relative overflow-hidden">
            <div className="slider-container w-full h-full relative">
                <Slider {...settings}>
                    {
                        products?.map((product, index) => (
                            <div key={product?.id} className="relative">
                                <div className={`min-h-screen bg-gradient-to-br ${product.gradient} relative overflow-hidden`}>
                                    {/* Elementos decorativos de fondo */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                                        <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                                        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-bounce delay-500"></div>
                                        <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
                                    </div>

                                    {/* Patrón de puntos decorativo */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-10 left-10 grid grid-cols-8 gap-4">
                                            {Array.from({ length: 32 }).map((_, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full bg-white/30"></div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="container mx-auto px-4 lg:px-8 relative z-10">
                                        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
                                            
                                            {/* Contenido del banner */}
                                            <div className="space-y-8 text-white">
                                                {/* Badge superior */}
                                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                                    <span className="text-sm font-semibold uppercase tracking-wider">
                                                        {product?.subTitle}
                                                    </span>
                                                    <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                                                </div>

                                                {/* Título principal */}
                                                <div className="space-y-4">
                                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                                                        {product?.title?.split(' ').map((word, i) => (
                                                            <span 
                                                                key={i} 
                                                                className={`inline-block mr-4 ${i % 2 === 0 ? 'text-white' : 'text-yellow-300'}`}
                                                                style={{
                                                                    animationDelay: `${index * 200 + i * 100}ms`,
                                                                    animation: 'fadeInUp 0.8s ease-out forwards'
                                                                }}
                                                            >
                                                                {word}
                                                            </span>
                                                        ))}
                                                    </h1>
                                                    
                                                    <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                                                        {product?.description}
                                                    </p>
                                                </div>

                                                {/* Estadísticas rápidas */}
                                                <div className="flex flex-wrap gap-6 text-white/80">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 bg-${product.accent}-400 rounded-full flex items-center justify-center`}>
                                                            <Star className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="font-semibold">500+ Técnicos</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                                            <Zap className="w-4 h-4 text-yellow-900" />
                                                        </div>
                                                        <span className="font-semibold">Respuesta 24/7</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-bold text-green-900">✓</span>
                                                        </div>
                                                        <span className="font-semibold">Garantía Total</span>
                                                    </div>
                                                </div>

                                                {/* Botones de acción */}
                                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                    <button className="group relative px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105 overflow-hidden">
                                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                                            Encontrar Técnico
                                                            <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    </button>
                                                    
                                                    <button className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-semibold text-lg backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                                                        Ver Servicios
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Imagen mejorada */}
                                            <div className="relative">
                                                <div className="relative z-10 transform hover:scale-105 transition-all duration-700">
                                                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
                                                    <img 
                                                        src={product?.image} 
                                                        alt={product?.title} 
                                                        className="relative z-10 w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-3xl"
                                                        style={{
                                                            animationDelay: `${index * 200 + 500}ms`,
                                                            animation: 'fadeInRight 0.8s ease-out forwards'
                                                        }}
                                                    />
                                                </div>
                                                
                                                {/* Elementos flotantes alrededor de la imagen */}
                                                <div className="absolute top-10 -left-10 w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float">
                                                    <span className="text-2xl">🔧</span>
                                                </div>
                                                <div className="absolute bottom-20 -right-10 w-24 h-24 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float delay-1000">
                                                    <span className="text-3xl">⚡</span>
                                                </div>
                                                <div className="absolute top-1/2 -right-16 w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center justify-center animate-float delay-500">
                                                    <span className="text-xl">🛠️</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </Slider>
            </div>

            {/* Estilos personalizados para animaciones */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
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
                        transform: translateY(-20px);
                    }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Banner;