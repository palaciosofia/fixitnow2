// src/MainLayout/MainLayout.jsx
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Home from "../Pages/Home/Home";
import { PublicLayout, SmartLayout } from "../layout/Layouts";
import { Loader } from "../ui";
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
  return <Loader />;
}

// Al cambiar de página vuelve arriba; con #ancla, baja hasta esa sección
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 50);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
}

const MainLayout = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Autenticación: pantallas propias, sin encabezado */}
          <Route path="auth" element={<Auth />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot" element={<Forgot />} />
          </Route>

          {/* Páginas públicas con encabezado y pie */}
          <Route element={<PublicLayout />}>
            <Route
              index
              element={
                <AuthCheck>
                  <Home />
                </AuthCheck>
              }
            />
            {["about", "contacto", "carreras", "terminos", "privacidad", "cookies"].map((p) => (
              <Route key={p} path={p} element={<Info page={p} />} />
            ))}
            <Route path="no-autorizado" element={<NoAutorizado />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* App: con sesión se ve con menú lateral; sin sesión, con el marco público */}
          <Route element={<SmartLayout />}>
            <Route path="tecnicos" element={<Catalog />} />
            <Route path="tecnicos/:slug" element={<Profile />} />
            <Route path="senias" element={<Senias />} />

            <Route path="agendar/:tid" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><Book /></ProtectedRoute>} />
            <Route path="perfil" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><Perfil /></ProtectedRoute>} />
            <Route path="mis-reservas" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><MisReservas /></ProtectedRoute>} />
            <Route path="pagos" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><Pagos /></ProtectedRoute>} />
            <Route path="mensajes" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><Mensajes /></ProtectedRoute>} />
            <Route path="chat/:otherUserId/:otherUserName" element={<ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}><Chat /></ProtectedRoute>} />

            {/* Técnico */}
            <Route path="mi-perfil" element={<ProtectedRoute allowedRoles={["tecnico", "admin"]}><TecnicoDashboard /></ProtectedRoute>} />
            <Route path="agenda" element={<ProtectedRoute allowedRoles={["tecnico", "admin"]}><Agenda /></ProtectedRoute>} />

            {/* Admin (protección por claim admin) */}
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>

          {/* Compatibilidad con rutas antiguas */}
          <Route path="catalogo" element={<Navigate to="/tecnicos" replace />} />
          <Route path="tecnico" element={<Navigate to="/mi-perfil" replace />} />
          <Route path="servicio/:id" element={<Navigate to="/tecnicos" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default MainLayout;
