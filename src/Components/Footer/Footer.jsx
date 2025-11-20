import { 
  Banknote, CreditCard, Truck, ShieldCheck, Facebook, Instagram, Twitter, Youtube, 
  MapPin, Phone, Mail, Clock, Star, Heart, Zap, Award, Users, Sparkles, ArrowRight, Rocket
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import bannerImage from "../../assets/brands/brand_2.png";
import logoImg from "../../assets/brands/brand_2.png";
import bannerLogo from "../../assets/Banner/banner_image.png";

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
      {/* Suscripción / Banner - Mejorado y Novedoso */}
      <div className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-20 relative overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"
            animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-10 right-10 w-48 h-48 bg-teal-200/30 rounded-full blur-3xl"
            animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          ></motion.div>
          <motion.div 
            className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-200/20 rounded-full blur-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity }}
          ></motion.div>
        </div>
        
        <div className="max-w-screen-xl mx-auto px-10 relative z-10">
          <motion.div 
            className="bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-16 shadow-2xl border-2 border-white/60 hover:border-emerald-200/80 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Texto + formulario */}
            <motion.div 
              className="flex-1 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <motion.span 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  ¡Únete a +10,000 usuarios!
                </motion.span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 leading-tight">
                Quédate en casa —<br />
                <span className="text-gray-800">Encuentra técnicos confiables</span>
              </h2>
              
              <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
                Suscríbete para recibir <strong>ofertas exclusivas</strong>, promociones especiales y las últimas actualizaciones de nuestros servicios.
              </p>

              <form className="max-w-lg space-y-4" onSubmit={(e) => e.preventDefault()}>
                <motion.div 
                  className="flex items-center bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden hover:border-emerald-400 transition-all duration-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
                  whileHover={{ boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)' }}
                >
                  <span className="px-6 text-emerald-600">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    aria-label="Tu correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    className="flex-1 px-4 py-4 text-lg outline-none bg-transparent"
                  />
                  <motion.button 
                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-8 py-4 m-2 rounded-xl font-bold shadow-lg transition-all duration-200"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Suscribirme
                  </motion.button>
                </motion.div>
                <motion.p 
                  className="text-sm text-gray-600 flex items-center gap-2 font-medium"
                  whileHover={{ x: 4 }}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  No spam. Cancela cuando quieras.
                </motion.p>
              </form>
            </motion.div>

            {/* Ilustración con efectos */}
            <motion.div 
              className="flex-1 hidden md:flex justify-end relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-2xl transform rotate-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                ></motion.div>
                <motion.div 
                  className="relative w-full max-w-[400px]"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={bannerImage}
                    alt="Técnicos profesionales"
                    className="w-full h-auto object-contain rounded-3xl shadow-2xl bg-gradient-to-br from-white to-gray-50 p-6 border border-white/50"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main footer columns rediseñado */}
      <div className="bg-gradient-to-b from-gray-900 via-slate-900 to-black text-white relative overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
            animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          ></motion.div>
        </div>
        
        <div className="max-w-screen-xl mx-auto px-10 py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Columna 1: Logo + Contacto */}
            <motion.div 
              className="md:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/" className="inline-block group">
                <motion.div 
                  className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 hover:border-emerald-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src={bannerLogo} 
                    alt="FixItNow Logo" 
                    className="w-12 h-12 rounded-xl object-cover" 
                    onError={(e)=> e.currentTarget.style.display='none'} 
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">FixItNow</h3>
                    <p className="text-sm text-gray-300">Tu solución técnica</p>
                  </div>
                </motion.div>
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
                  {[
                    { Icon: MapPin, text: "Barranquilla, Colombia" },
                    { Icon: Phone, text: "+57 (324) 123-4567" },
                    { Icon: Mail, text: "soporte@fixitnow.co" },
                    { Icon: Clock, text: "Lun - Sáb: 9:00 - 18:00" },
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-emerald-400/30 transition-all cursor-pointer"
                      whileHover={{ x: 4 }}
                    >
                      <item.Icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-gray-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Columna 2: Empresa */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
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
                ].map((item, idx) => (
                  <motion.li key={item.to} whileHover={{ x: 4 }}>
                    <Link 
                      to={item.to} 
                      className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Columna 3: Servicios */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h5 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Nuestros Servicios
              </h5>
              <ul className="space-y-3">
                {ESPECIALIDADES.map((servicio, idx) => (
                  <motion.li key={servicio} whileHover={{ x: 4 }}>
                    <Link 
                      to={`/tecnicos?esp=${encodeURIComponent(servicio)}`} 
                      className="flex items-center gap-3 text-gray-300 hover:text-emerald-400 transition-all duration-200 p-2 rounded-lg hover:bg-white/5 group"
                    >
                      <motion.div 
                        className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center group-hover:from-emerald-500/40 group-hover:to-teal-500/40 transition-all"
                        whileHover={{ rotate: 12 }}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                      {servicio}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Columna 4: Redes y estadísticas */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h5 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Síguenos
              </h5>
              
              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:border-emerald-400/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-emerald-400"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    10K+
                  </motion.div>
                  <div className="text-xs text-gray-400">Usuarios activos</div>
                </motion.div>
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:border-teal-400/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-teal-400"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  >
                    500+
                  </motion.div>
                  <div className="text-xs text-gray-400">Técnicos verificados</div>
                </motion.div>
              </div>
              
              {/* Redes sociales */}
              <div className="flex items-center gap-3">
                {[
                  { Icon: Facebook, href: "#", color: "hover:bg-blue-600" },
                  { Icon: Twitter, href: "#", color: "hover:bg-sky-500" },
                  { Icon: Instagram, href: "#", color: "hover:bg-pink-600" },
                  { Icon: Youtube, href: "#", color: "hover:bg-red-600" },
                ].map(({ Icon, href, color }, index) => (
                  <motion.a 
                    key={index}
                    href={href} 
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 ${color} hover:scale-110 transition-all duration-300 group`}
                    whileHover={{ scale: 1.15 }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.a>
                ))}
              </div>

              {/* Métodos de pago */}
              <div className="space-y-3">
                <h6 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-green-400" />
                  Métodos de Pago
                </h6>
                <div className="flex items-center gap-3">
                  {['Visa', 'Mastercard', 'PayPal'].map((payment) => (
                    <motion.div 
                      key={payment} 
                      className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-xs text-gray-300 hover:bg-white/20 transition-all cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                    >
                      {payment}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom bar mejorado */}
      <div className="bg-black border-t border-gray-800">
        <div className="max-w-screen-xl mx-auto px-10 py-8">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
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
                  <motion.a 
                    key={label}
                    href={href} 
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-200 p-2 rounded-lg hover:bg-white/5"
                    whileHover={{ scale: 1.2, rotate: 8 }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
