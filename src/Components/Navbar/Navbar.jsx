// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import { Wrench, Check, Info, Menu, Search, User, ChevronDown, Zap, Hammer, Paintbrush, Car, Home, Refrigerator, Wind, WashingMachine, MessageSquare } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { logoutUser as logoutHelper } from "../../services/auth";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { subscribeToUnreadCount } from "../../services/messages";
import bannerLogo from "../../assets/Banner/banner_image.png";

const ROLE_CACHE_KEY = "fixit_role";

// Mapea etiqueta → clave esperada por el backend/Firestore
const ESP_MAP = {
  "Plomería": "plomeria",
  "Electricidad": "electricidad",
  "Reparación de neveras": "reparacion de neveras",
  "Reparación de lavadoras": "reparacion de lavadoras",
  "Aires acondicionados": "aires acondicionados",
  "Carpintería": "carpinteria",
  "Pintura": "pintura",
  "Cerrajería": "cerrajeria",
  "Instalación de gasodomésticos": "instalacion de gasodomesticos",
  "Drywall": "drywall",
};

const ESP_ICONS = {
  "Plomería": Wrench,
  "Electricidad": Zap,
  "Reparación de neveras": Refrigerator,
  "Reparación de lavadoras": WashingMachine,
  "Aires acondicionados": Wind,
  "Carpintería": Hammer,
  "Pintura": Paintbrush,
  "Cerrajería": Home,
  "Instalación de gasodomésticos": Car,
  "Drywall": Home,
};

const ESPECIALIDADES = Object.keys(ESP_MAP);

const roleLabel = (r) => {
  if (r === "tecnico") return "Técnico";
  if (r === "admin") return "Administrador";
  if (r === "cliente") return "Cliente";
  return "Invitado";
};

const roleBadgeClass = (r) => {
  switch (r) {
    case "tecnico":
      return "badge badge-sm bg-green-600 text-white";
    case "admin":
      return "badge badge-sm bg-neutral-900 text-white";
    case "cliente":
      return "badge badge-sm bg-sky-200 text-sky-900";
    default:
      return "badge badge-sm bg-gray-200 text-gray-700";
  }
};

// 🔹 Helper de clases para links (activo vs inactivo)
const baseLink =
  "text-base md:text-lg font-inter font-semibold capitalize transition-all duration-300 px-4 py-2 rounded-xl hover:shadow-lg transform hover:scale-105";
// estilo más suave para activo: color + fondo leve redondeado (sin la línea azul dura)
const activeLink =
  "text-white bg-gradient-to-r from-teal-500 to-cyan-500 shadow-xl";
const idleLink =
  "text-[#636270] hover:text-white hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400";

const Navbar = () => {
  const [openAccount, setOpenAccount] = useState(false);
  const [openEsp, setOpenEsp] = useState(false);
  const [q, setQ] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const espRef = useRef(null); // ref para detectar clics fuera del dropdown
  const navigate = useNavigate();
  const location = useLocation();

  // Helpers desde el AuthProvider
  const { user, role, isAdmin, isCliente, isTecnico } = useAuth();

  // Ticker de mensajes en el topbar: mostrar uno por vez (fade+slide)
  const TOP_MESSAGES = [
    "🔥 ¡Técnicos verificados cerca de ti!",
    "⚡ Soporte 24/7 — siempre disponibles",
    "⭐ +10,000 clientes satisfechos",
    "💳 Reserva en minutos, pago 100% seguro",
    "🛡️ Garantía total en trabajos seleccionados",
    "🎉 ¡Ofertas especiales esta semana!",
  ];

  const [openLang, setOpenLang] = useState(false);
  const [lang, setLang] = useState("es");
  const [unreadCount, setUnreadCount] = useState(0);

  // Suscribirse a contador de mensajes no leídos
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = subscribeToUnreadCount(user.uid, setUnreadCount);
    return () => unsubscribe();
  }, [user?.uid]);

  // Cierra menús al navegar
  useEffect(() => {
    setOpenAccount(false);
    setOpenEsp(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex((i) => (i + 1) % TOP_MESSAGES.length);
    }, 3600);
    return () => clearInterval(t);
  }, [TOP_MESSAGES.length]);

  // Cerrar el dropdown de especialidades al hacer clic fuera
  useEffect(() => {
    function onDocClick(e) {
      if (espRef.current && !espRef.current.contains(e.target)) {
        setOpenEsp(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof logoutHelper === "function") {
        await logoutHelper();
      } else {
        await signOut(auth);
      }
      localStorage.removeItem(ROLE_CACHE_KEY);
      setOpenAccount(false);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const query = q?.trim();
    if (query) {
      navigate(`/tecnicos?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/tecnicos");
    }
  };

  // UI según rol real (claim/admin manda)
  const badgeRoleKey = isAdmin ? "admin" : role;
  const badgeLabel = isAdmin ? "Administrador" : roleLabel(role);

  // 🔹 isActive personalizado para Catálogo (cubre subrutas/queries)
  const isCatalogo = location.pathname.startsWith("/tecnicos");

  return (
    <div className="w-full">
      {/* Navbar top: ticker (uno a la vez) + idioma (dropdown personalizado)
          sticky para mantenerse visible al hacer scroll */}
      <div className="navbar_top sticky top-0 z-[100] flex items-center justify-center bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 h-[72px] w-full shadow-xl backdrop-blur-sm overflow-visible">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-32 -translate-y-32 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-x-24 -translate-y-24 animate-pulse delay-1000"></div>
        </div>

        <div className="lg:container flex flex-wrap justify-between items-center gap-4 px-4 relative z-10">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            {/* Mensajes deslizantes sin fondo */}
            <div className="flex items-center justify-center flex-1 min-w-[200px] max-w-lg mx-4">
              <div className="relative h-8 flex items-center">
                {TOP_MESSAGES.map((m, i) => (
                  <span
                    key={i}
                    className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-lg md:text-xl font-bold text-white transition-all duration-700 transform ${
                      msgIndex === i ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                    }`}
                    aria-hidden={msgIndex !== i}
                    role={msgIndex === i ? "status" : undefined}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="navbar_top_right flex items-center gap-6 relative">
            {/* Indicadores de confianza */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 w-[140px] justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">500+ Técnicos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 w-[140px] justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-500"></div>
                <span className="text-sm font-semibold text-white">98% Satisfacción</span>
              </div>
            </div>

            {/* Dropdown de idioma mejorado */}
            <div className="relative z-[120]" onMouseLeave={() => setOpenLang(false)}>
              <button
                onClick={() => setOpenLang((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={openLang}
                className="flex items-center gap-3 text-sm font-semibold text-white bg-white/20 backdrop-blur-md h-[44px] px-4 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg"
                title="Seleccionar idioma"
              >
                <span className="inline-flex items-center justify-center w-8 h-6 bg-white/20 rounded-md text-xs font-bold">
                  {lang?.toUpperCase()}
                </span>
                <span className="hidden sm:block">Idioma</span>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${openLang ? "rotate-180" : ""}`} />
              </button>

              {openLang && (
                <div
                  className="absolute right-0 top-full mt-2"
                  style={{ zIndex: 999999 }}
                >
                  <ul
                    className="w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 overflow-hidden"
                    role="menu"
                  >
                    <li>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r from-emerald-50 to-teal-50 text-gray-700 font-semibold transition-all duration-200 flex items-center gap-3"
                        onClick={() => {
                          setLang("es");
                          setOpenLang(false);
                        }}
                      >
                        <span className="text-lg">🇪🇸</span>
                        <span>Español</span>
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r from-emerald-50 to-teal-50 text-gray-700 font-semibold transition-all duration-200 flex items-center gap-3"
                        onClick={() => {
                          setLang("en");
                          setOpenLang(false);
                        }}
                      >
                        <span className="text-lg">🇺🇸</span>
                        <span>English</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar middle */}
      <div className="navbar_middle flex items-center justify-center bg-[#f0f2f3] w-full h-[100px] relative z-[50]">
        <div className="lg:container grid grid-cols-3 items-center px-4">
          {/* Logo */}
          <div className="logo_wrapper">
            <Link
              to="/"
              className="group flex items-center gap-4 hover:scale-105 transition-all duration-300"
              aria-label="Ir al inicio"
            >
              {/* Logo mejorado */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <img
                  src={bannerLogo}
                  alt="FixItNow"
                  className="relative w-16 h-16 rounded-xl object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                />
                {/* Punto de actividad */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>

              {/* Nombre mejorado */}
              <div className="flex flex-col">
                <h1 className="text-4xl font-black bg-gradient-to-r from-gray-800 via-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300">
                  FixItNow
                </h1>
                <span className="text-sm text-emerald-600 font-semibold tracking-wider uppercase opacity-80">
                  Tu solución técnica
                </span>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="search_box">
            <form onSubmit={submitSearch} className="max-w-[500px] h-[50px] relative mx-auto">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar técnico o especialidad…"
                aria-label="Buscar técnico o especialidad"
                className="max-w-[500px] w-full h-full bg-white rounded-xl pl-5 pr-14 outline-none font-medium text-gray-700 placeholder:text-gray-500 shadow-md border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center"
                aria-label="Buscar"
                title="Buscar"
              >
                <Search size="20px" color="#272343" />
              </button>
            </form>
          </div>

          {/* Right section */}
          <div className="navbar_middle_right flex items-center gap-4 relative justify-end">
            {/* Chip de rol */}
            {user && (
              <span
                className={`${roleBadgeClass(badgeRoleKey)} hidden sm:inline-flex`}
                title={`Rol: ${badgeLabel}`}
              >
                {badgeLabel}
              </span>
            )}

            {/* Account dropdown mejorado */}
            <div className="relative z-[70]">
              <button
                type="button"
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20 relative z-[70]"
                onClick={() => setOpenAccount((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={openAccount}
                aria-label="Cuenta"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="hidden sm:block">Cuenta</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openAccount ? "rotate-180" : ""}`} />
              </button>

              {openAccount && (
                <div className="absolute right-0 top-full mt-2 z-[80]">
                  <ul
                    className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 w-72 p-4 overflow-hidden z-[150]"
                    role="menu"
                    onMouseLeave={() => setOpenAccount(false)}
                  >
                    {!user ? (
                      <>
                        <li className="mb-2">
                          <Link
                            to="/auth/login"
                            onClick={() => setOpenAccount(false)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                          >
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <span>Iniciar sesión</span>
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/auth/register"
                            onClick={() => setOpenAccount(false)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                          >
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold">+</span>
                            </div>
                            <span>Crear cuenta</span>
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="pointer-events-none mb-4">
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {user?.email || "Usuario"}
                              </div>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${roleBadgeClass(
                                  badgeRoleKey
                                )}`}
                              >
                                {badgeLabel}
                              </span>
                            </div>
                          </div>
                        </li>

                        {/* Menú según rol */}
                        {isAdmin ? (
                          <li className="mb-2">
                            <Link
                              to="/admin"
                              onClick={() => setOpenAccount(false)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                            >
                              Panel administrador
                            </Link>
                          </li>
                        ) : (
                          <>
                            {isCliente && (
                              <>
                                <li className="mb-2">
                                  <Link
                                    to="/mis-reservas"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    Mis reservas
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/pagos"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    💰 Mis pagos
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/mensajes"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200 relative"
                                  >
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Mensajes</span>
                                    {unreadCount > 0 && (
                                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {unreadCount}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/perfil"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    Mi perfil
                                  </Link>
                                </li>
                              </>
                            )}
                            {isTecnico && (
                              <>
                                <li className="mb-2">
                                  <Link
                                    to="/mi-perfil"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    Mi perfil (técnico)
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/agenda"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    Agenda
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/mensajes"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200 relative"
                                  >
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Mensajes</span>
                                    {unreadCount > 0 && (
                                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {unreadCount}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                                <li className="mb-2">
                                  <Link
                                    to="/mi-perfil"
                                    onClick={() => setOpenAccount(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all duration-200"
                                  >
                                    Mis servicios
                                  </Link>
                                </li>
                              </>
                            )}
                          </>
                        )}

                        <li className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-all duration-200"
                          >
                            Cerrar sesión
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar bottom */}
      <div className="navbar_bottom flex items-center justify-center w-full h-[84px] bg-gradient-to-r from-white via-teal-50/30 to-white border-b border-teal-200/50 shadow-lg">
        <div className="lg:container flex items-center justify-between px-4">
          {/* Izquierda: Especialidades */}
          <div className="flex items-center">
            <div className="relative" ref={espRef}>
              <button
                type="button"
                className="flex items-center gap-2 capitalize bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl border-0 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                onClick={() => setOpenEsp((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={openEsp}
                aria-label="Abrir especialidades"
              >
                <Wrench className="w-5 h-5" />
                <span className="font-semibold">Especialidades</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openEsp ? 'rotate-180' : ''}`} />
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openEsp ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute left-0 mt-4 z-20 w-80 max-h-96 overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border-0 shadow-2xl backdrop-blur-sm transition-all duration-300 origin-top ${
                  openEsp
                    ? "opacity-100 scale-100 visible"
                    : "opacity-0 scale-95 invisible pointer-events-none"
                }`}
                role="menu"
                aria-hidden={!openEsp}
              >
                <div className="p-4">
                  <div className="text-base font-bold text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text px-2 py-3 border-b border-teal-100 mb-3">
                    ✨ Especialidades Disponibles
                  </div>
                <ul className="space-y-1">
                  {ESPECIALIDADES.map((label) => {
                    const key = ESP_MAP[label] || label.toLowerCase();
                    const IconComponent = ESP_ICONS[label] || Wrench;
                    return (
                      <li key={label}>
                        <Link
                          to={`/tecnicos?esp=${encodeURIComponent(key)}`}
                          onClick={() => setOpenEsp(false)}
                          className="group flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gradient-to-r hover:from-teal-500/10 hover:to-cyan-500/10 text-gray-700 hover:text-teal-800 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] hover:translate-x-1 border border-transparent hover:border-teal-200/50"
                        >
                          <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-cyan-500/20 group-hover:from-teal-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                            <IconComponent size={18} className="text-teal-600 group-hover:text-teal-700 transition-colors" />
                          </div>
                          <span className="font-semibold text-sm group-hover:text-teal-800">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Centro: navegación (centrada y con más separación) */}
          <nav className="flex-1 flex justify-center gap-10">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
            >
              Inicio
            </NavLink>
            <NavLink
              to="/tecnicos"
              className={() => `${baseLink} ${isCatalogo ? activeLink : idleLink}`}
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/senias"
              className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
            >
              Reseñas
            </NavLink>
            {isCliente && (
              <>
                <NavLink
                  to="/mis-reservas"
                  className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
                >
                  Mis reservas
                </NavLink>
                <NavLink
                  to="/pagos"
                  className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
                >
                  💰 Mis pagos
                </NavLink>
              </>
            )}
            {isTecnico && (
              <>
                <NavLink
                  to="/mi-perfil"
                  className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
                >
                  Técnico
                </NavLink>
                <NavLink
                  to="/agenda"
                  className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
                >
                  Agenda
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Derecha: espacio vacío para mantener balance visual */}
          <div className="flex items-center">
            {/* Espacio reservado para futuras funcionalidades */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
