// src/layout/Layouts.jsx
// Dos marcos de página:
//  - PublicLayout: encabezado + pie, para visitantes (inicio, catálogo sin sesión, páginas informativas).
//  - SmartLayout: si hay sesión, la app con menú lateral (estilo panel); si no, el marco público.
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  MessageCircle,
  Wallet,
  UserRound,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  Shield,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { logoutUser } from "../services/auth";
import { subscribeToUnreadCount } from "../services/messages";
import { Avatar, Button, Logo } from "../ui";
import { cx } from "../ui/cx";

/* ------------------------------------------------------------------ */
/*  Menú según el rol                                                  */
/* ------------------------------------------------------------------ */
function menuFor(role) {
  if (role === "tecnico") {
    return [
      { to: "/mi-perfil", label: "Mi perfil", icon: UserRound, end: true },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
      { to: "/mensajes", label: "Mensajes", icon: MessageCircle, badge: "unread" },
      { to: "/mi-perfil?tab=pagos", label: "Pagos", icon: Wallet, match: "pagos" },
      { to: "/mi-perfil?tab=resenas", label: "Reseñas", icon: Star, match: "resenas" },
      { to: "/tecnicos", label: "Explorar", icon: Search },
    ];
  }
  if (role === "admin") {
    return [
      { to: "/admin", label: "Administración", icon: Shield },
      { to: "/tecnicos", label: "Explorar", icon: Search },
      { to: "/mensajes", label: "Mensajes", icon: MessageCircle, badge: "unread" },
    ];
  }
  return [
    { to: "/tecnicos", label: "Explorar", icon: Search },
    { to: "/mis-reservas", label: "Mis reservas", icon: CalendarDays },
    { to: "/mensajes", label: "Mensajes", icon: MessageCircle, badge: "unread" },
    { to: "/pagos", label: "Pagos", icon: Wallet },
    { to: "/perfil", label: "Mi perfil", icon: UserRound },
  ];
}

const ROLE_LABEL = { cliente: "Cliente", tecnico: "Técnico", admin: "Administrador" };

function useUnreadCount(uid) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!uid) return;
    return subscribeToUnreadCount(uid, setCount);
  }, [uid]);
  return count;
}

function useLogout() {
  const navigate = useNavigate();
  return async () => {
    try {
      await logoutUser();
    } finally {
      navigate("/", { replace: true });
    }
  };
}

/* ¿Este ítem del menú es la página actual? (considera ?tab=…) */
function isItemActive(item, location) {
  const [path, query] = item.to.split("?");
  if (!location.pathname.startsWith(path)) return false;
  const tab = new URLSearchParams(location.search).get("tab");
  if (query) return tab === item.match;
  if (item.end) return !tab;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Marco de la app (con sesión)                                       */
/* ------------------------------------------------------------------ */
function AppShell() {
  const { user, profile, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const unread = useUnreadCount(user?.uid);
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = menuFor(role);
  const name = profile?.name || user?.displayName || user?.email || "Mi cuenta";

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/tecnicos?q=${encodeURIComponent(term)}` : "/tecnicos");
  };

  const sidebar = (
    <div className="flex h-full flex-col px-3.5 py-[18px] text-sm">
      <div className="px-2 pb-6"><Logo to={role === "tecnico" ? "/mi-perfil" : "/tecnicos"} /></div>
      <p className="mx-2 mb-2 text-xs text-subtle">Menú</p>
      <nav aria-label="Menú principal" className="flex flex-col gap-0.5">
        {items.map((it) => {
          const active = isItemActive(it, location);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-10 items-center gap-2.5 rounded-[10px] px-2.5 transition-colors",
                active ? "bg-brand-soft font-medium text-brand-ink" : "text-muted hover:bg-canvas hover:text-ink"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="flex-1">{it.label}</span>
              {it.badge === "unread" && unread > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                  {unread}
                  <span className="sr-only"> sin leer</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-line pt-5">
        <p className="mx-2 mb-2 text-xs text-subtle">Soporte</p>
        <Link to="/contacto" className="flex min-h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-muted hover:bg-canvas hover:text-ink">
          <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /> Ayuda
        </Link>
        <button type="button" onClick={logout} className="flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-muted hover:bg-canvas hover:text-ink">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Menú lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 border-r border-line bg-white lg:block">
        {sidebar}
      </aside>

      {/* Menú lateral (celular) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="relative h-full w-[260px] bg-white shadow-xl">
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas lg:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="sm:hidden"><Logo to={role === "tecnico" ? "/mi-perfil" : "/tecnicos"} /></div>
          <form role="search" onSubmit={onSearch} className="hidden h-10 w-full max-w-[340px] items-center gap-2 rounded-[10px] border border-line px-3 text-subtle focus-within:border-brand sm:flex">
            <Search className="h-4 w-4" aria-hidden="true" />
            <label htmlFor="app-search" className="sr-only">Buscar técnico o servicio</label>
            <input
              id="app-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar técnico o servicio"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle"
            />
          </form>
          <div className="flex-1" />
          <Link to="/mensajes" aria-label={unread ? `Mensajes, ${unread} sin leer` : "Mensajes"} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:bg-canvas">
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F04438]" aria-hidden="true" />}
          </Link>
          <Link to={role === "tecnico" ? "/mi-perfil" : role === "admin" ? "/admin" : "/perfil"} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-canvas">
            <Avatar name={name} src={profile?.photoURL} size={36} />
            <span className="hidden text-left sm:block">
              <span className="block max-w-[160px] truncate text-[13px] font-semibold">{name}</span>
              <span className="block text-xs text-subtle">{ROLE_LABEL[role] || "Cuenta"}</span>
            </span>
          </Link>
        </header>

        <main id="contenido" className="w-full flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          <Outlet />
        </main>

        {/* Navegación inferior (celular) */}
        <nav aria-label="Navegación" className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-line bg-white lg:hidden">
          {items.slice(0, 4).map((it) => {
            const active = isItemActive(it, location);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} aria-current={active ? "page" : undefined} className={cx("flex flex-col items-center justify-center gap-0.5 text-[11px]", active ? "font-semibold text-brand-ink" : "text-muted")}>
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marco público                                                      */
/* ------------------------------------------------------------------ */
export function PublicHeader() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const panelPath = role === "tecnico" ? "/mi-perfil" : role === "admin" ? "/admin" : "/tecnicos";
  const linkCls = ({ isActive }) => cx("text-sm transition-colors", isActive ? "font-medium text-ink" : "text-muted hover:text-ink");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-7 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Principal" className="hidden flex-1 gap-6 md:flex">
          <NavLink to="/tecnicos" className={linkCls}>Técnicos</NavLink>
          <NavLink to="/senias" className={linkCls}>Reseñas</NavLink>
          <Link to="/#como-funciona" className="text-sm text-muted hover:text-ink">Cómo funciona</Link>
          <NavLink to="/carreras" className={linkCls}>Soy técnico</NavLink>
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <Button to={panelPath}>Ir a mi panel</Button>
          ) : (
            <>
              <Button to="/auth/login" variant="ghost">Iniciar sesión</Button>
              <Button to="/auth/register">Crear cuenta</Button>
            </>
          )}
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="menu-publico" aria-label="Menú" className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas md:hidden">
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav id="menu-publico" aria-label="Principal" className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          <Link to="/tecnicos" className="rounded-lg px-2 py-2.5 text-sm hover:bg-canvas">Técnicos</Link>
          <Link to="/senias" className="rounded-lg px-2 py-2.5 text-sm hover:bg-canvas">Reseñas</Link>
          <Link to="/carreras" className="rounded-lg px-2 py-2.5 text-sm hover:bg-canvas">Soy técnico</Link>
          <div className="mt-2 flex gap-2">
            {user ? (
              <Button to={panelPath} className="flex-1">Ir a mi panel</Button>
            ) : (
              <>
                <Button to="/auth/login" variant="secondary" className="flex-1">Iniciar sesión</Button>
                <Button to="/auth/register" className="flex-1">Crear cuenta</Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
        <span>© {new Date().getFullYear()} FixItNow · Barranquilla</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/about" className="hover:text-ink">Acerca de</Link>
          <Link to="/terminos" className="hover:text-ink">Términos</Link>
          <Link to="/privacidad" className="hover:text-ink">Privacidad</Link>
          <Link to="/cookies" className="hover:text-ink">Cookies</Link>
          <Link to="/contacto" className="hover:text-ink">Contacto</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

/* Con sesión: app con menú lateral. Sin sesión: marco público con fondo gris. */
export function SmartLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <AppShell />;
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
