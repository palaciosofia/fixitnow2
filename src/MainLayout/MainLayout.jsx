// src/MainLayout/MainLayout.jsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Home from "../Pages/Home/Home";
import Auth from "../Pages/Auth/Auth";
import Login from "../Pages/Auth/Login/Login";
import Register from "../Pages/Auth/Register/Register";
import Forgot from "../Pages/Auth/Forgot/Forgot";
import Error from "../Pages/Error/Error";
import AuthCheck from "../AuthCheck/AuthCheck";
import Footer from "../Components/Footer/Footer";
import ServiceDetail from "../Pages/ServiceDetail/ServiceDetail";
import Book from "../Pages/Book/Book";

// Protecciones por rol
import ProtectedRoute from "../routing/ProtectedRoute";
import AdminRoute from "../routing/AdminRoute";
import TecnicoDashboard from "../Pages/Tecnico/Dashboard";
import AdminPanel from "../Pages/Admin/AdminPanel";
import Perfil from "../Pages/Perfil/Perfil";
import NoAutorizado from "../Pages/NoAutorizado";


// ✅ Catálogo
import Catalog from "../Pages/Catalog/Catalog";
// ✅ Perfil público del técnico
import Profile from "../Pages/Technicians/Profile";

// ✅ NUEVO: Reservas (cliente) y Agenda (técnico)
import MisReservas from "../Pages/Cliente/MisReservas";
import Agenda from "../Pages/Tecnico/Agenda";
// ✅ Página de Señas
import Senias from "../Pages/Senias/Senias";
// ✅ Página de Pagos
import Pagos from "../Pages/Pagos/Pagos";
// ✅ Mensajes
import Mensajes from "../Pages/Mensajes/Mensajes";
import Chat from "../Pages/Chat/Chat";

const MainLayout = () => {
  useEffect(() => {
    console.log("App cargada");
  }, []);

  return (
    <BrowserRouter>
      <Navbar />

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

        {/* ✅ Catálogo público */}
        <Route path="tecnicos" element={<Catalog />} />
        {/* ✅ Perfil público por slug */}
        <Route path="tecnicos/:slug" element={<Profile />} />
        {/* ✅ Señas - Servicios de lenguaje de señas */}
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

        {/* ✅ NUEVO: Cliente → Mis reservas */}
        <Route
          path="mis-reservas"
          element={
            <ProtectedRoute allowedRoles={["cliente", "tecnico", "admin"]}>
              <MisReservas />
            </ProtectedRoute>
          }
        />

        {/* ✅ NUEVO: Cliente → Pagos */}
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
        {/* ✅ NUEVO: Técnico → Agenda */}
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

        {/* ✅ Mensajes */}
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

        {/* 404 */}
        <Route path="*" element={<Error />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
};

export default MainLayout;
