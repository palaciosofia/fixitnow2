// src/Components/Navbar/Navbar.jsx
import { useEffect, useState, useRef } from "react";
import { Wrench, Check, Info, Menu, Search, User, ChevronDown } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { logoutUser as logoutHelper } from "../../services/auth";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

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
  "text-base md:text-lg font-inter font-semibold capitalize transition-all duration-150";
// estilo más suave para activo: color + fondo leve redondeado (sin la línea azul dura)
const activeLink =
  "text-[#029fae] bg-[#e6fbfb] rounded-md px-3 py-1";
const idleLink =
  "text-[#636270] hover:text-[#029fae]";

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
  }, []);

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

  // Ticker de mensajes en el topbar: mostrar uno por vez (fade+slide)
  const TOP_MESSAGES = [
    "Técnicos verificados cerca de ti",
    "Soporte 24/7 — siempre disponibles",
    "Reseñas reales de clientes satisfechos",
    "Reserva en minutos, pago seguro",
    "Garantía en trabajos seleccionados",
    "Promociones semanales en servicios",
  ];
  const [openLang, setOpenLang] = useState(false);
  const [lang, setLang] = useState("es");

  return (
    <div className="w-full">
      {/* Navbar top: ticker (uno a la vez) + idioma (dropdown personalizado)
          sticky para mantenerse visible al hacer scroll */}
      <div className="navbar_top sticky top-0 z-50 flex items-center justify-center bg-gradient-to-r from-teal-800 via-teal-600 to-teal-800 h-[72px] w-full shadow-md backdrop-blur-sm">
        <div className="lg:container flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <Check className="w-5 h-5 text-white" />

            {/* Pill del ticker: más grande y con texto blanco */}
            <div
              className="relative overflow-hidden rounded-full bg-teal-700/28 border border-teal-700/30 px-7 py-3"
              style={{ minWidth: 480 }}
              aria-hidden={false}
            >
              <div className="relative h-8">
                {TOP_MESSAGES.map((m, i) => (
                  <span
                    key={i}
                    className={`absolute left-0 top-0 whitespace-nowrap text-xl md:text-2xl font-semibold text-white transition-all duration-500 transform ${
                      msgIndex === i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
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

          <div className="navbar_top_right flex items-center gap-4 relative">
            {/* Dropdown de idioma personalizado (fondo oscuro para que el texto sea legible) */}
            <div className="relative" onMouseLeave={() => setOpenLang(false)}>
              <button
                onClick={() => setOpenLang((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={openLang}
                className="flex items-center gap-2 text-sm font-inter text-white bg-transparent h-[34px] px-3 rounded"
                title="Seleccionar idioma"
              >
                <span className="inline-block w-6 text-center bg-white/10 rounded text-xs py-0.5">{lang?.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4 text-white" />
              </button>

              {openLang && (
                <ul
                  className="absolute right-0 mt-2 w-28 bg-[#272343] text-white rounded shadow-lg z-30 py-1"
                  role="menu"
                >
                  <li>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-[#1f1a2a]"
                      onClick={() => {
                        setLang("es");
                        setOpenLang(false);
                      }}
                    >
                      ES - Español
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-[#1f1a2a]"
                      onClick={() => {
                        setLang("en");
                        setOpenLang(false);
                      }}
                    >
                      EN - English
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navbar middle */}
      <div className="navbar_middle flex items-center justify-center bg-[#f0f2f3] w-full h-[84px]">
        <div className="lg:container grid grid-cols-3 items-center px-4">
          {/* Logo */}
          <div className="logo_wrapper">
            <Link
              to="/"
              className="text-3xl text-black font-inter font-semibold capitalize flex items-center gap-2"
              aria-label="Ir al inicio"
            >
              <Wrench size="2rem" color="#029fae" /> FixItNow
            </Link>
          </div>

          {/* Search */}
          <div className="search_box">
            <form onSubmit={submitSearch} className="max-w-[500px] h-[44px] relative mx-auto">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar técnico o especialidad…"
                aria-label="Buscar técnico o especialidad"
                className="max-w-[500px] w-full h-full bg-white rounded-lg pl-4 pr-12 outline-none"
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

            {/* Account dropdown */}
            <button
              type="button"
              className="btn capitalize w-10 h-10 grid place-items-center"
              onClick={() => setOpenAccount((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={openAccount}
              aria-label="Cuenta"
            >
              <User />
            </button>

            {openAccount && (
              <ul
                className="absolute right-0 top-12 dropdown-content menu bg-base-100 rounded-box z-20 w-64 p-2 shadow-sm"
                role="menu"
                onMouseLeave={() => setOpenAccount(false)}
              >
                {!user ? (
                  <>
                    <li>
                      <Link to="/auth/login" onClick={() => setOpenAccount(false)}>
                        Iniciar sesión
                      </Link>
                    </li>
                    <li>
                      <Link to="/auth/register" onClick={() => setOpenAccount(false)}>
                        Crear cuenta
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="pointer-events-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate max-w-[160px]">
                          {user?.email || "Cuenta"}
                        </span>
                        <span className={roleBadgeClass(badgeRoleKey)}>{badgeLabel}</span>
                      </div>
                    </li>

                    {/* Menú según rol */}
                    {isAdmin ? (
                      <li>
                        <Link to="/admin" onClick={() => setOpenAccount(false)}>
                          Panel administrador
                        </Link>
                      </li>
                    ) : (
                      <>
                        {isCliente && (
                          <>
                            <li>
                              <Link to="/mis-reservas" onClick={() => setOpenAccount(false)}>
                                Mis reservas
                              </Link>
                            </li>
                            <li>
                              <Link to="/perfil" onClick={() => setOpenAccount(false)}>
                                Mi perfil
                              </Link>
                            </li>
                          </>
                        )}
                        {isTecnico && (
                          <>
                            <li>
                              <Link to="/mi-perfil" onClick={() => setOpenAccount(false)}>
                                Mi perfil (técnico)
                              </Link>
                            </li>
                            <li>
                              <Link to="/agenda" onClick={() => setOpenAccount(false)}>
                                Agenda
                              </Link>
                            </li>
                            <li>
                              <Link to="/mi-perfil" onClick={() => setOpenAccount(false)}>
                                Mis servicios
                              </Link>
                            </li>
                          </>
                        )}
                      </>
                    )}

                    <li>
                      <button onClick={handleLogout}>Cerrar sesión</button>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Navbar bottom */}
      <div className="navbar_bottom flex items-center justify-center w-full h-[84px] bg-white border-b border-[#e1e3e5]">
        <div className="lg:container flex items-center justify-between px-4">
          {/* Izquierda: Especialidades */}
          <div className="flex items-center">
            <div className="relative" ref={espRef}>
              <button
                type="button"
                className="flex items-center gap-2 capitalize bg-white/90 hover:bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-md"
                onClick={() => setOpenEsp((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={openEsp}
                aria-label="Abrir especialidades"
              >
                <Menu /> <span className="font-medium">Especialidades</span>
              </button>

              <div
                className={`absolute left-0 mt-3 z-20 w-64 max-h-80 overflow-auto bg-white rounded-lg border border-gray-100 shadow-xl p-3 transition-all duration-200 origin-top ${
                  openEsp ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                }`}
                role="menu"
                aria-hidden={!openEsp}
              >
                <ul className="space-y-2">
                  {ESPECIALIDADES.map((label) => {
                    const key = ESP_MAP[label] || label.toLowerCase();
                    return (
                      <li key={label}>
                        <Link
                          to={`/tecnicos?esp=${encodeURIComponent(key)}`}
                          onClick={() => setOpenEsp(false)}
                          className="block px-3 py-2 rounded hover:bg-teal-50 text-sm text-teal-800"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Centro: navegación (centrada y con más separación) */}
          <nav className="flex-1 flex justify-center gap-10">
            <NavLink to="/" end className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>Inicio</NavLink>
            <NavLink to="/tecnicos" className={() => `${baseLink} ${isCatalogo ? activeLink : idleLink}`}>Catálogo</NavLink>
            {isCliente && <NavLink to="/mis-reservas" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>Mis reservas</NavLink>}
            {isTecnico && <>
              <NavLink to="/mi-perfil" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>Técnico</NavLink>
              <NavLink to="/agenda" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>Agenda</NavLink>
            </>}
            {isAdmin && <NavLink to="/admin" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}>Admin</NavLink>}
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
