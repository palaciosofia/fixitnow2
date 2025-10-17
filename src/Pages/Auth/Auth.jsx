// src/Pages/Auth/Auth.jsx
import { Outlet } from "react-router-dom";

export default function Auth() {
  return (
    <div className="min-h-[70vh]">
      <Outlet />
    </div>
  );
}
