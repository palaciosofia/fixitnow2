// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import dayjs from "dayjs";
import "dayjs/locale/es";
import relativeTime from "dayjs/plugin/relativeTime";
import MainLayout from "./MainLayout/MainLayout.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import "./index.css";

// Fechas en español en toda la app ("lunes, 3 de noviembre", "hace 5 minutos")
dayjs.extend(relativeTime);
dayjs.locale("es");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  </StrictMode>
);
