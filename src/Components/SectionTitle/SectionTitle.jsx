
import { Sparkles, Star, Zap } from "lucide-react";

const SectionTitle = ({title, mb, textAlign, variant = "default", subtitle, icon}) => {
    const margin = mb || 'mb-0';
    
    // Variantes de estilo
    const variants = {
        default: {
            container: "bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-200/50 backdrop-blur-sm",
            title: "text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent",
            subtitle: "text-gray-600 mt-2",
            decoration: "w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mt-4"
        },
        hero: {
            container: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-12 text-white relative overflow-hidden",
            title: "text-4xl md:text-6xl font-black text-white drop-shadow-lg",
            subtitle: "text-white/90 mt-3 text-lg",
            decoration: "w-20 h-1 bg-yellow-400 rounded-full mx-auto mt-6"
        },
        elegant: {
            container: "bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 relative",
            title: "text-3xl md:text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent",
            subtitle: "text-gray-500 mt-3",
            decoration: "w-24 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mx-auto mt-5"
        },
        minimal: {
            container: "p-6",
            title: "text-2xl md:text-3xl font-bold text-gray-800 relative",
            subtitle: "text-gray-600 mt-2 text-sm",
            decoration: "w-12 h-0.5 bg-emerald-500 rounded-full mt-3"
        }
    };

    const currentVariant = variants[variant] || variants.default;
    const alignment = textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left';
    const justification = textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start';

    // Iconos predefinidos
    const iconMap = {
        sparkles: <Sparkles className="w-8 h-8" />,
        star: <Star className="w-8 h-8" />,
        zap: <Zap className="w-8 h-8" />
    };

    return (
        <div className={`w-full flex items-center ${justification} ${margin}`}>
            <div className={`${currentVariant.container} ${alignment} relative group hover:shadow-2xl transition-all duration-500 max-w-4xl`}>
                
                {/* Elementos decorativos para variantes hero y elegant */}
                {variant === 'hero' && (
                    <>
                        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute top-1/2 left-8 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="absolute top-8 right-12 w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </>
                )}
                
                {variant === 'elegant' && (
                    <>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full blur-3xl opacity-60"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100 to-blue-100 rounded-full blur-2xl opacity-40"></div>
                    </>
                )}

                {/* Contenido principal */}
                <div className="relative z-10">
                    {/* Icono superior */}
                    {icon && (
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                            variant === 'hero' 
                                ? 'bg-white/20 text-white border border-white/30' 
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg'
                        }`}>
                            {iconMap[icon] || icon}
                        </div>
                    )}

                    {/* Título principal */}
                    <h3 className={`${currentVariant.title} leading-tight tracking-tight group-hover:scale-105 transition-transform duration-300`}>
                        {title}
                    </h3>

                    {/* Subtítulo */}
                    {subtitle && (
                        <p className={`${currentVariant.subtitle} max-w-2xl ${textAlign === 'center' ? 'mx-auto' : ''}`}>
                            {subtitle}
                        </p>
                    )}

                    {/* Decoración inferior */}
                    <div className={`${currentVariant.decoration} ${textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : 'mr-auto'} group-hover:scale-110 transition-transform duration-300`}></div>
                </div>

                {/* Elementos flotantes para variante minimal */}
                {variant === 'minimal' && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full opacity-60 animate-bounce"></div>
                )}
            </div>
        </div>
    );
};

export default SectionTitle;