// src/Pages/Admin/AdminPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, query, where, orderBy, limit, startAfter, getDocs,
  updateDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { Search, ArrowLeft, ArrowRight, Trash2, Check, X } from "lucide-react";

// helper: iniciales para avatar cuando no hay foto
function getInitials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PAGE_SIZE = 20;

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("tecnicos"); // "tecnicos" | "usuarios"
  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Panel de administración</h1>

      <div className="tabs mb-6">
        <button
          className={`tab tab-bordered ${tab === "tecnicos" ? "tab-active" : ""}`}
          onClick={() => setTab("tecnicos")}
        >
          Ver técnicos
        </button>
        <button
          className={`tab tab-bordered ${tab === "usuarios" ? "tab-active" : ""}`}
          onClick={() => setTab("usuarios")}
        >
          Ver usuarios
        </button>
      </div>

      {tab === "tecnicos" ? <TecnicosTable /> : <UsuariosTable />}
    </div>
  );
}

/* =========================================================
 * TÉCNICOS
 * =======================================================*/
function TecnicosTable() {
  const [items, setItems] = useState([]);
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState(""); // "", "publicado", "en_revision", "bloqueado"
  const [qText, setQText] = useState("");   // búsqueda por nombre
  const [busy, setBusy] = useState(false);
  const [pageStack, setPageStack] = useState([]); // simple
  const lastDocRef = useRef(null);

  const filtersDesc = useMemo(() => {
    const parts = [];
    if (ciudad) parts.push(`Ciudad: ${ciudad}`);
    if (estado) parts.push(`Estado: ${estado}`);
    if (qText) parts.push(`Búsqueda: ${qText}`);
    return parts.join(" · ") || "Sin filtros";
  }, [ciudad, estado, qText]);

  // Dentro de TecnicosTable()
  const fetchPage = async (direction = "first") => {
    setBusy(true);
    try {
      const col = collection(db, "technicians");
      const clauses = [];
      if (estado) clauses.push(where("estado", "==", estado));
      if (ciudad) clauses.push(where("ciudad", "==", ciudad));

      // 👉 Ordenamos por nombre (no dependemos de createdAt)
      let base = query(col, ...clauses, orderBy("nombre"), limit(PAGE_SIZE));
      if (direction === "next" && lastDocRef.current) {
        base = query(col, ...clauses, orderBy("nombre"), startAfter(lastDocRef.current), limit(PAGE_SIZE));
      }

      const snap = await getDocs(base);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => !t.deletedAt); // oculta soft-deleted

      setItems(list);

      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
        if (direction === "next") setPageStack(prev => [...prev, lastDocRef.current]);
        if (direction === "first") setPageStack([lastDocRef.current]);
      }
    } finally {
      setBusy(false);
    }
  };


  const prevPage = async () => {
    await fetchPage("first");
  };

  useEffect(() => {
    fetchPage("first");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudad, estado]);

  const searchNow = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    try {
      const col = collection(db, "technicians");
      const clauses = [];
      if (estado) clauses.push(where("estado", "==", estado));
      if (ciudad) clauses.push(where("ciudad", "==", ciudad));

      let base = query(col, ...clauses, orderBy("nombre"), limit(PAGE_SIZE));
      const snap = await getDocs(base);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t =>
          !t.deletedAt && (qText ? (t.nombre?.toLowerCase()?.includes(qText.toLowerCase())) : true)
        );
      setItems(list);
    } finally {
      setBusy(false);
    }
  };

  const updateEstadoTecnico = async (id, publicado, nuevoEstado) => {
    setBusy(true);
    try {
      const ref = doc(db, "technicians", id);
      await updateDoc(ref, { publicado, estado: nuevoEstado, updatedAt: serverTimestamp() });
      setItems(prev => prev.map(it => it.id === id ? { ...it, publicado, estado: nuevoEstado } : it));
    } finally {
      setBusy(false);
    }
  };

  const softDelete = async (id) => {
    if (!confirm("¿Eliminar (soft) este técnico? Se ocultará del listado incluso al refrescar.")) return;
    setBusy(true);
    try {
      const ref = doc(db, "technicians", id);
      await updateDoc(ref, { deletedAt: serverTimestamp(), publicado: false, estado: "bloqueado", updatedAt: serverTimestamp() });
      setItems(prev => prev.filter(it => it.id !== id)); // 👈 ya no aparece
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros mejorados */}
      <form onSubmit={searchNow} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-1">
          <label className="text-sm font-medium mb-1 block">Ciudad</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></span>
            <input
              className="w-full border rounded px-3 py-2 pl-10"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Barranquilla"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Estado</label>
          <select className="w-full border rounded px-3 py-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">(Todos)</option>
            <option value="publicado">Publicado</option>
            <option value="en_revision">En revisión</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Buscar nombre</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-600 text-white" type="submit" disabled={busy}>
              <Search className="w-4 h-4" /> Buscar
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded border" type="button" onClick={() => fetchPage("first")} disabled={busy}>
              Refrescar
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
        <div className="px-3 py-1 rounded-full bg-gray-100">{filtersDesc}</div>
        <div className="px-3 py-1 rounded-full bg-white border text-sm">Mostrando: <b>{items.length}</b></div>
      </div>

      {/* Tabla visual */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-3">Técnico</th>
              <th className="py-3">Ciudad</th>
              <th className="py-3">Estado</th>
              <th className="py-3">Publicado</th>
              <th className="py-3">Especialidades</th>
              <th className="py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(t => (
              <tr key={t.id} className="align-top border-b last:border-b-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center font-semibold">
                      {getInitials(t.nombre || t.id)}
                    </div>
                    <div>
                      <div className="font-medium">{t.nombre || t.id}</div>
                      <div className="text-xs text-gray-500">{t.email || ""}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">{t.ciudad || "-"}</td>
                <td className="py-3"><span className={`px-2 py-1 rounded text-xs ${t.estado === "publicado" ? "bg-emerald-100 text-emerald-800" : t.estado === "bloqueado" ? "bg-rose-100 text-rose-800" : "bg-yellow-50 text-yellow-800"}`}>{t.estado || "-"}</span></td>
                <td className="py-3">{t.publicado ? <span className="text-sm text-emerald-700">Sí</span> : <span className="text-sm text-gray-500">No</span>}</td>
                <td className="py-3 max-w-[260px] truncate text-sm text-gray-700">{Array.isArray(t.especialidades) ? t.especialidades.join(", ") : "-"}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button title="Publicar" className="inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-600 text-white text-xs" onClick={() => updateEstadoTecnico(t.id, true, "publicado")} disabled={busy}><Check className="w-3 h-3" /> Publicar</button>
                    <button title="Poner en revisión" className="inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-50 text-yellow-800 text-xs border" onClick={() => updateEstadoTecnico(t.id, false, "en_revision")} disabled={busy}><X className="w-3 h-3" /> Revisión</button>
                    <button title="Bloquear" className="inline-flex items-center gap-2 px-2 py-1 rounded bg-rose-50 text-rose-800 text-xs border" onClick={() => updateEstadoTecnico(t.id, false, "bloqueado")} disabled={busy}><X className="w-3 h-3" /> Bloquear</button>
                    <button title="Eliminar (soft)" className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => softDelete(t.id)} disabled={busy}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple más visual */}
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 px-3 py-1 rounded border" onClick={prevPage} disabled={busy}><ArrowLeft className="w-4 h-4" /> Reiniciar</button>
        <div className="text-sm text-gray-600">Página: <b>{pageStack.length || 1}</b></div>
        <button className="inline-flex items-center gap-2 px-3 py-1 rounded border" onClick={() => fetchPage("next")} disabled={busy}>Siguiente <ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* =========================================================
 * USUARIOS
 * =======================================================*/
function UsuariosTable() {
  const [items, setItems] = useState([]);
  const [qText, setQText] = useState("");
  const [busy, setBusy] = useState(false);
  const lastDocRef = useRef(null);

  const fetchPage = async (direction = "first") => {
    setBusy(true);
    try {
      const col = collection(db, "users");
      let base = query(col, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      if (direction === "next" && lastDocRef.current) {
        base = query(col, orderBy("createdAt", "desc"), startAfter(lastDocRef.current), limit(PAGE_SIZE));
      }
      const snap = await getDocs(base);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => !u.deletedAt); // 👈 oculta los soft-deleted SIEMPRE
      setItems(list);
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchPage("first");
  }, []);

  const searchNow = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    try {
      const col = collection(db, "users");
      const snap = await getDocs(query(col, orderBy("email"), limit(PAGE_SIZE)));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u =>
          !u.deletedAt && (
            qText
              ? (u.email?.toLowerCase()?.includes(qText.toLowerCase()) ||
                 u.nombre?.toLowerCase()?.includes(qText.toLowerCase()))
              : true
          )
        );
      setItems(list);
    } finally {
      setBusy(false);
    }
  };

  const softDelete = async (id) => {
    if (!confirm("¿Eliminar (soft) esta cuenta? No se mostrará más en la lista incluso al refrescar.")) return;
    setBusy(true);
    try {
      const ref = doc(db, "users", id);
      await updateDoc(ref, { deletedAt: serverTimestamp() });
      setItems(prev => prev.filter(it => it.id !== id)); // 👈 ya no aparece
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros mejorados */}
      <form onSubmit={searchNow} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Buscar usuario</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full border rounded px-3 py-2 pl-10"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Buscar por email o nombre"
              />
            </div>
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-emerald-600 text-white" 
              type="submit" 
              disabled={busy}
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>
        
        <div>
          <button 
            className="inline-flex items-center gap-2 px-3 py-2 rounded border w-full justify-center" 
            type="button" 
            onClick={() => fetchPage("first")} 
            disabled={busy}
          >
            Refrescar
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
        <div className="px-3 py-1 rounded-full bg-gray-100">
          {qText ? `Búsqueda: ${qText}` : "Sin filtros"}
        </div>
        <div className="px-3 py-1 rounded-full bg-white border text-sm">
          Mostrando: <b>{items.length}</b>
        </div>
      </div>

      {/* Tabla visual */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-3">Usuario</th>
              <th className="py-3">Rol</th>
              <th className="py-3">Ciudad</th>
              <th className="py-3">Teléfono</th>
              <th className="py-3">Fecha registro</th>
              <th className="py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id} className="align-top border-b last:border-b-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 grid place-items-center font-semibold">
                      {getInitials(u.nombre || u.email)}
                    </div>
                    <div>
                      <div className="font-medium">{u.nombre || "Sin nombre"}</div>
                      <div className="text-xs text-gray-500 font-mono">{u.email || "-"}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    u.role === "admin" ? "bg-purple-100 text-purple-800" :
                    u.role === "technician" ? "bg-emerald-100 text-emerald-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {u.role || "usuario"}
                  </span>
                </td>
                <td className="py-3 text-sm">{u.ciudad || "-"}</td>
                <td className="py-3 text-sm font-mono">{u.telefono || "-"}</td>
                <td className="py-3 text-sm text-gray-600">
                  {u.createdAt?.toDate?.()?.toLocaleDateString?.("es-ES") || "-"}
                </td>
                <td className="py-3">
                  <button 
                    title="Eliminar usuario (soft delete)" 
                    className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs" 
                    onClick={() => softDelete(u.id)} 
                    disabled={busy}
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple más visual */}
      <div className="flex items-center gap-3">
        <button 
          className="inline-flex items-center gap-2 px-3 py-1 rounded border" 
          onClick={() => fetchPage("first")} 
          disabled={busy}
        >
          <ArrowLeft className="w-4 h-4" /> Reiniciar
        </button>
        <div className="text-sm text-gray-600">
          Usuarios encontrados: <b>{items.length}</b>
        </div>
        <button 
          className="inline-flex items-center gap-2 px-3 py-1 rounded border" 
          onClick={() => fetchPage("next")} 
          disabled={busy}
        >
          Siguiente <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
