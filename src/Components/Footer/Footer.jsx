import { 
  Banknote, CreditCard, Truck, ShieldCheck, Facebook, Instagram, Twitter, Youtube, 
  MapPin, Phone, Mail, Clock, Star, Heart, Zap, Award, Users, Sparkles 
} from "lucide-react";
import { Link } from "react-router-dom";
import bannerImage from "../../assets/brands/brand_2.png";
import logoImg from "../../assets/brands/brand_2.png";

const ESPECIALIDADES = [
  "Plomería",
  "Electricidad", 
  "Reparación de neveras",
  "Aires acondicionados",
  "Carpintería",
  "Cerrajería",
];

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-slate-50 to-white text-gray-700 overflow-hidden">
      {/* Suscripción / Banner */}
      <div className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-16 relative">
        {/* Elementos decorativos*/}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-200/20 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto px-10 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/20">
            {/* Texto + formulario */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                  ¡Únete a +10,000 usuarios!
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 leading-tight">
                Quédate en casa —<br />
                <span className="text-gray-800">Encuentra técnicos confiables</span>
              </h2>
              
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Suscríbete para recibir <strong>ofertas exclusivas</strong>, promociones especiales y las últimas actualizaciones de nuestros servicios.
              </p>

              <form className="max-w-lg space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="flex items-center bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:border-emerald-300 transition-all duration-300 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                  <span className="px-6 text-emerald-600">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    aria-label="Tu correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    className="flex-1 px-4 py-4 text-lg outline-none bg-transparent"
                  />
                  <button className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-8 py-4 m-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    Suscribirme
                  </button>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  No spam. Cancela cuando quieras.
                </p>
              </form>
            </div>

            {/* Ilustración*/}
            <div className="flex-1 hidden md:flex justify-end relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl transform rotate-6"></div>
                <div className="relative w-full max-w-[400px]">
                  <img
                    src={bannerImage}
                    alt="Técnicos profesionales"
                    className="w-full h-auto object-contain rounded-3xl shadow-2xl bg-gradient-to-br from-white to-gray-50 p-6 border border-white/50"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beneficios / Features rediseñados */}
      <div className="w-full py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-screen-xl mx-auto px-10">
          {/* Título de sección */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-500" />
              <h3 className="text-3xl font-bold text-gray-900">¿Por qué elegir FixItNow?</h3>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Miles de usuarios confían en nosotros para conectar con los mejores técnicos
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Tarjeta 1 - Precios */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-emerald-200">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Mejores Precios</h4>
              <p className="text-sm text-gray-600 mb-3">Tarifas competitivas</p>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                Desde $50.000
              </span>
            </div>

            {/* Tarjeta 2 - Pago */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-blue-200">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Pago Seguro</h4>
              <p className="text-sm text-gray-600 mb-3">100% protegido</p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                SSL Certificado
              </span>
            </div>

            {/* Tarjeta 3 - Rapidez */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-purple-200">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Súper Rápido</h4>
              <p className="text-sm text-gray-600 mb-3">Reserva en minutos</p>
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                En 3 clics
              </span>
            </div>

            {/* Tarjeta 4 - Verificación */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-orange-200">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Verificados</h4>
              <p className="text-sm text-gray-600 mb-3">Profesionales certificados</p>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                100% Confiables
              </span>
            </div>

            {/* Tarjeta 5 - Soporte */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-cyan-200">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Soporte 24/7</h4>
              <p className="text-sm text-gray-600 mb-3">Siempre disponibles</p>
              <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                Chat en vivo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer columns rediseñado */}
      <div className="bg-gradient-to-b from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto px-10 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Columna 1: Logo + Contacto mejorado */}
            <div className="md:col-span-1 space-y-6">
              <Link to="/" className="inline-block group">
                <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <img 
                    src={logoImg} 
                    alt="FixItNow Logo" 
                    className="w-12 h-12 rounded-xl" 
                    onError={(e)=> e.currentTarget.style.display='none'} 
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">FixItNow</h3>
                    <p className="text-sm text-gray-300">Tu solución técnica</p>
                  </div>
                </div>
              </Link>

              <p className="text-gray-300 leading-relaxed">
                Conectamos a <strong className="text-emerald-400">miles de usuarios</strong> con técnicos verificados y profesionales. 
                Agenda, recibe tu servicio y califica la experiencia.
              </p>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  Contáctanos
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">Barranquilla, Colombia</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">+57 (324) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">soporte@fixitnow.co</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300">Lun - Sáb: 9:00 - 18:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Empresa */}
            <div className="space-y-6">
              <h5 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Empresa
              </h5>
              <ul className="space-y-3">
                {[
                  { to: "/about", label: "Acerca de nosotros" },
                  { to: "/terminos", label: "Términos y condiciones" },
                  { to: "/privacidad", label: "Política de privacidad" },
                  { to: "/contacto", label: "Contacto y soporte" },
                  { to: "/carreras", label: "Trabaja con nosotros" },
                ].map((item) => (
                  <li key={item.to}>
                    <Link 
                      to={item.to} 
                      className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 3: Servicios mejorada */}
            <div className="space-y-6">
              <h5 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Nuestros Servicios
              </h5>
              <ul className="space-y-3">
                {ESPECIALIDADES.map((servicio) => (
                  <li key={servicio}>
                    <Link 
                      to={`/tecnicos?esp=${encodeURIComponent(servicio)}`} 
                      className="flex items-center gap-3 text-gray-300 hover:text-emerald-400 transition-all duration-200 p-2 rounded-lg hover:bg-white/5 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center group-hover:from-emerald-500/40 group-hover:to-teal-500/40 transition-all">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      {servicio}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 4: Redes y estadísticas */}
            <div className="space-y-6">
              <h5 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Síguenos
              </h5>
              
              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                  <div className="text-2xl font-bold text-emerald-400">10K+</div>
                  <div className="text-xs text-gray-400">Usuarios activos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                  <div className="text-2xl font-bold text-teal-400">500+</div>
                  <div className="text-xs text-gray-400">Técnicos verificados</div>
                </div>
              </div>
              
              {/* Redes sociales mejoradas */}
              <div className="flex items-center gap-3">
                {[
                  { Icon: Facebook, href: "#", color: "hover:bg-blue-600" },
                  { Icon: Twitter, href: "#", color: "hover:bg-sky-500" },
                  { Icon: Instagram, href: "#", color: "hover:bg-pink-600" },
                  { Icon: Youtube, href: "#", color: "hover:bg-red-600" },
                ].map(({ Icon, href, color }, index) => (
                  <a 
                    key={index}
                    href={href} 
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 ${color} hover:scale-110 transition-all duration-300 group`}
                    aria-label={`Síguenos en ${Icon.name}`}
                  >
                    <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>

              {/* Métodos de pago mejorados */}
              <div className="space-y-3">
                <h6 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-400" />
                  Métodos de Pago
                </h6>
                <div className="flex items-center gap-3">
                  {['Visa', 'Mastercard', 'PayPal'].map((payment) => (
                    <div key={payment} className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-xs text-gray-300">
                      {payment}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar mejorado */}
      <div className="bg-black border-t border-gray-800">
        <div className="max-w-screen-xl mx-auto px-10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} <strong className="text-white">FixItNow</strong> — Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <Link to="/terminos" className="hover:text-emerald-400 transition-colors">Términos</Link>
                <span>•</span>
                <Link to="/privacidad" className="hover:text-emerald-400 transition-colors">Privacidad</Link>
                <span>•</span>
                <Link to="/cookies" className="hover:text-emerald-400 transition-colors">Cookies</Link>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Hecho con amor en Colombia
              </span>
              
              <div className="flex items-center gap-3">
                {[
                  { Icon: Facebook, href: "#", label: "Facebook" },
                  { Icon: Twitter, href: "#", label: "Twitter" },
                  { Icon: Instagram, href: "#", label: "Instagram" },
                ].map(({ Icon, href, label }) => (
                  <a 
                    key={label}
                    href={href} 
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
