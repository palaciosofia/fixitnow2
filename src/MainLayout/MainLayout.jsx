// src/MainLayout/MainLayout.jsx
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";
import Home from "../Pages/Home/Home";
import AuthCheck from "../AuthCheck/AuthCheck";

// Protecciones por rol
import ProtectedRoute from "../routing/ProtectedRoute";
import AdminRoute from "../routing/AdminRoute";

// Las demás páginas se cargan bajo demanda (code-splitting): el usuario solo
// descarga el código de las páginas que visita.
const Auth = lazy(() => import("../Pages/Auth/Auth"));
const Login = lazy(() => import("../Pages/Auth/Login/Login"));
const Register = lazy(() => import("../Pages/Auth/Register/Register"));
const Forgot = lazy(() => import("../Pages/Auth/Forgot/Forgot"));
const NotFound = lazy(() => import("../Pages/Error/Error"));
const ServiceDetail = lazy(() => import("../Pages/ServiceDetail/ServiceDetail"));
const Book = lazy(() => import("../Pages/Book/Book"));
const TecnicoDashboard = lazy(() => import("../Pages/Tecnico/Dashboard"));
const AdminPanel = lazy(() => import("../Pages/Admin/AdminPanel"));
const Perfil = lazy(() => import("../Pages/Perfil/Perfil"));
const NoAutorizado = lazy(() => import("../Pages/NoAutorizado"));
const Catalog = lazy(() => import("../Pages/Catalog/Catalog"));
const Profile = lazy(() => import("../Pages/Technicians/Profile"));
const MisReservas = lazy(() => import("../Pages/Cliente/MisReservas"));
const Agenda = lazy(() => import("../Pages/Tecnico/Agenda"));
const Senias = lazy(() => import("../Pages/Senias/Senias"));
const Pagos = lazy(() => import("../Pages/Pagos/Pagos"));
const Mensajes = lazy(() => import("../Pages/Mensajes/Mensajes"));
const Chat = lazy(() => import("../Pages/Chat/Chat"));
const Info = lazy(() => import("../Pages/Info/Info"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

// Al cambiar de página, vuelve arriba (salvo enlaces con #ancla)
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const MainLayout = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />

      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <AuthCheck>
              <Home />
            </AuthCheck>
          }
        />

        {/* Auth */}
        <Route path="auth" element={<Auth />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot" element={<Forgot />} />
        </Route>

        {/* Público */}
        <Route path="servicio/:id" element={<ServiceDetail />} />

        {/* Catálogo público */}
        <Route path="tecnicos" element={<Catalog />} />
        {/* Perfil público por slug */}
        <Route path="tecnicos/:slug" element={<Profile />} />
        {/* Señas - Servicios de lenguaje de señas */}
        <Route path="senias" element={<Senias />} />

        {/* Compatibilidad: /catalogo → /tecnicos */}
        <Route path="catalogo" element={<Navigate to="/tecnicos" replace />} />

        {/* Cliente/Técnico/Admin */}
        <Route
          path="agendar/:tid"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <Book />
            </ProtectedRoute>
          }
        />
        <Route
          path="perfil"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <Perfil />
            </ProtectedRoute>
          }
        />

        {/* Cliente → Mis reservas */}
        <Route
          path="mis-reservas"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <MisReservas />
            </ProtectedRoute>
          }
        />

        {/* Cliente → Pagos */}
        <Route
          path="pagos"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <Pagos />
            </ProtectedRoute>
          }
        />

        {/* Técnico */}
        <Route
          path="mi-perfil"
          element={
            <ProtectedRoute allowedRoles={["tecnico", "admin"]}>
              <TecnicoDashboard />
            </ProtectedRoute>
          }
        />
        {/* Técnico → Agenda */}
        <Route
          path="agenda"
          element={
            <ProtectedRoute allowedRoles={["tecnico", "admin"]}>
              <Agenda />
            </ProtectedRoute>
          }
        />

        {/* Alias legacy → redirige a /mi-perfil */}
        <Route path="tecnico" element={<Navigate to="/mi-perfil" replace />} />

        {/* Admin (protección por claim admin) */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        {/* Bloqueo por rol */}
        <Route path="no-autorizado" element={<NoAutorizado />} />

        {/* Mensajes */}
        <Route
          path="mensajes"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <Mensajes />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat/:otherUserId/:otherUserName"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Páginas informativas (footer) */}
        {["about", "contacto", "carreras", "terminos", "privacidad", "cookies"].map((p) => (
          <Route key={p} path={p} element={<Info page={p} />} />
        ))}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

      <Footer />
    </BrowserRouter>
  );
};

export default MainLayout;
