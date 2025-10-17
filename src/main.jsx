// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MainLayout from "./MainLayout/MainLayout.jsx";

import AuthProvider from "./context/AuthProvider.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  </StrictMode>
);




