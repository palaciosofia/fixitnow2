// src/Pages/Admin/AdminPanel.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import {
  Search,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  Users,
  BarChart3,
  Filter,
} from "lucide-react";

// helper: iniciales para avatar cuando no hay foto
function getInitials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("tecnicos");

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-12 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1
                className="text-4xl font-black"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Panel de administración
              </h1>
              <p className="text-white/80">
                Gestiona técnicos y usuarios de la plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setTab("tecnicos")}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-lg transition-all relative ${
              tab === "tecnicos"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            Técnicos
            {tab === "tecnicos" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setTab("usuarios")}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-lg transition-all relative ${
              tab === "usuarios"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-6 h-6" />
            Usuarios
            {tab === "usuarios" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Content */}
        {tab === "tecnicos" ? <TecnicosTable /> : <UsuariosTable />}
      </div>
    </div>
  );
}

/* =========================================================
 * TÉCNICOS
 * =======================================================*/
function TecnicosTable() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    ciudad: "",
    estado: "",
    qText: "",
  });

  useEffect(() => {
    loadTecnicos();
  }, []);

  async function loadTecnicos() {
    setLoading(true);
    try {
      // 🔹 Trae TODOS los docs de 'technicians' sin orderBy
      const snapshot = await getDocs(collection(db, "technicians"));
      let items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));

      // 🔹 Orden opcional en memoria por createdAt (si existe)
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis?.() ? b.createdAt.toMillis() : 0;
        return tb - ta; // más recientes primero
      });

      setTecnicos(items);
    } catch (error) {
      console.error("Error loading técnicos:", error);
      setTecnicos([]);
    }
    setLoading(false);
  }

  function aplicarFiltros(allTecnicos) {
    let filtered = allTecnicos;

    if (filters.estado) {
      filtered = filtered.filter((t) => t.estado === filters.estado);
    }
    if (filters.ciudad) {
      const city = filters.ciudad.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.ciudad || "").toLowerCase().includes(city)
      );
    }
    if (filters.qText) {
      const q_text = filters.qText.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nombre?.toLowerCase().includes(q_text) ||
          t.email?.toLowerCase().includes(q_text)
      );
    }

    return filtered;
  }

  async function handlePublish(id, estado) {
    try {
      await updateDoc(doc(db, "technicians", id), {
        estado: estado === "publicado" ? "revision" : "publicado",
        updatedAt: serverTimestamp(),
      });
      loadTecnicos();
    } catch (error) {
      console.error("Error updating técnico:", error);
    }
  }

  async function handleDelete(id) {
    if (confirm("¿Estás seguro de que quieres bloquear este técnico?")) {
      try {
        await updateDoc(doc(db, "technicians", id), {
          estado: "bloqueado",
          updatedAt: serverTimestamp(),
        });
        loadTecnicos();
      } catch (error) {
        console.error("Error deleting técnico:", error);
      }
    }
  }

  const tecnicosFiltered = aplicarFiltros(tecnicos);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <Filter className="w-5 h-5 text-emerald-600" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre o email..."
              value={filters.qText}
              onChange={(e) => {
                setFilters({ ...filters, qText: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Ciudad
            </label>
            <input
              type="text"
              placeholder="Ej: Barranquilla"
              value={filters.ciudad}
              onChange={(e) => {
                setFilters({ ...filters, ciudad: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => {
                setFilters({ ...filters, estado: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">Todos</option>
              <option value="publicado">Publicado</option>
              <option value="revision">Revisión</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
          <div className="flex items	end">
            <button
              onClick={() => {
                setFilters({ ciudad: "", estado: "", qText: "" });
              }}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Técnicos */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-emerald-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600">Cargando técnicos...</p>
          </div>
        ) : tecnicosFiltered.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">
              No hay técnicos para mostrar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-gray-200">
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Técnico
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Ciudad
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Estado
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Especialidades
                  </th>
                  <th
                    className="px-6 py-4 text-center font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tecnicosFiltered.map((tecnico) => (
                  <tr key={tecnico.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(tecnico.nombre)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {tecnico.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tecnico.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {tecnico.ciudad}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          tecnico.estado === "publicado"
                            ? "bg-green-100 text-green-700"
                            : tecnico.estado === "revision"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tecnico.estado || "sin_estado"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {tecnico.especialidades?.slice(0, 2).map((esp, i) => (
                          <span
                            key={i}
                            className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold"
                          >
                            {esp}
                          </span>
                        ))}
                        {tecnico.especialidades?.length > 2 && (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                            +{tecnico.especialidades.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            handlePublish(tecnico.id, tecnico.estado)
                          }
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm transition ${
                            tecnico.estado === "publicado"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {tecnico.estado === "publicado"
                            ? "Revisión"
                            : "Publicar"}
                        </button>
                        <button
                          onClick={() => handleDelete(tecnico.id)}
                          className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Bloquear
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contador de resultados */}
        {!loading && tecnicosFiltered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm text-gray-600 font-semibold">
              Total:{" "}
              <span className="text-emerald-700">
                {tecnicosFiltered.length}
              </span>{" "}
              técnico{tecnicosFiltered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
 * USUARIOS
 * =======================================================*/
function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ qText: "" });

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    try {
      let snapshot;

      // Intentar primero con "usuarios"
      try {
        snapshot = await getDocs(collection(db, "usuarios"));
      } catch (err) {
        console.log("Colección 'usuarios' no encontrada, intentando 'users'...");
        snapshot = await getDocs(collection(db, "users"));
      }

      let items = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          nombre: raw.nombre ?? raw.name ?? "",
          email: raw.email ?? "",
          telefono: raw.telefono ?? "",
          reservas: raw.reservas ?? [],
          bloqueado: raw.bloqueado ?? false,
          createdAt: raw.createdAt ?? null,
        };
      });

      // Orden por fecha si existe
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis?.() ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });

      setUsuarios(items);
    } catch (error) {
      console.error("Error loading usuarios:", error);
      setUsuarios([]);
    }
    setLoading(false);
  }

  function aplicarFiltrosUsuarios(allUsuarios) {
    if (!filters.qText) {
      return allUsuarios;
    }

    const q_text = filters.qText.toLowerCase();
    return allUsuarios.filter(
      (u) =>
        u.nombre?.toLowerCase().includes(q_text) ||
        u.email?.toLowerCase().includes(q_text)
    );
  }

  async function handleBlock(id) {
    if (confirm("¿Bloquear este usuario?")) {
      try {
        // Intentar con "usuarios" primero, si falla usar "users"
        try {
          await updateDoc(doc(db, "usuarios", id), {
            bloqueado: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          await updateDoc(doc(db, "users", id), {
            bloqueado: true,
            updatedAt: serverTimestamp(),
          });
        }
        loadUsuarios();
      } catch (error) {
        console.error("Error blocking usuario:", error);
      }
    }
  }

  const usuariosFiltered = aplicarFiltrosUsuarios(usuarios);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <Filter className="w-5 h-5 text-emerald-600" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Buscar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={filters.qText}
                onChange={(e) => {
                  setFilters({ ...filters, qText: e.target.value });
                }}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
          <div></div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ qText: "" });
              }}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-emerald-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">
              No hay usuarios para mostrar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-gray-200">
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Usuario
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Teléfono
                  </th>
                  <th
                    className="px-6 py-4 text-left font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Reservas
                  </th>
                  <th
                    className="px-6 py-4 text-center font-bold text-gray-700"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltered.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(usuario.nombre)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {usuario.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {usuario.bloqueado ? "🚫 Bloqueado" : "✓ Activo"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {usuario.telefono || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {usuario.reservas?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleBlock(usuario.id)}
                          disabled={usuario.bloqueado}
                          className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Bloquear
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contador de resultados */}
        {!loading && usuariosFiltered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm text-gray-600 font-semibold">
              Total:{" "}
              <span className="text-emerald-700">
                {usuariosFiltered.length}
              </span>{" "}
              usuario{usuariosFiltered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
