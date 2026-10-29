// src/Pages/Admin/AdminPanel.jsx
// Administración: técnicos (publicar / ocultar / bloquear) y usuarios (bloquear).
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, updateDoc, where, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Search, Users, Wrench, Wallet, ShieldBan } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { Alert, Avatar, Badge, Button, Card, Loader, PageHeader, Rating, Segmented, Select } from "../../ui";
import { techPath } from "../../utils/catalog";
import { cx } from "../../ui/cx";

const ESTADO = {
  publicado: { label: "Publicado", tone: "success" },
  revision: { label: "Sin publicar", tone: "neutral" },
  bloqueado: { label: "Bloqueado", tone: "danger" },
};
const ROLE_LABEL = { cliente: "Cliente", tecnico: "Técnico", admin: "Admin" };

const byCreatedDesc = (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("tecnicos");
  const [tecnicos, setTecnicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pagosRevision, setPagosRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTecnicos = useCallback(async () => {
    const snap = await getDocs(collection(db, "technicians"));
    // "estado" se deriva de los campos que usa la app (publicado / blocked)
    setTecnicos(
      snap.docs
        .map((d) => {
          const data = d.data();
          return { ...data, id: d.id, estado: data.blocked ? "bloqueado" : data.publicado ? "publicado" : "revision" };
        })
        .sort(byCreatedDesc)
    );
  }, []);

  const loadUsuarios = useCallback(async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsuarios(
      snap.docs
        .map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            nombre: raw.nombre ?? raw.name ?? "",
            email: raw.email ?? "",
            telefono: raw.telefono ?? "",
            role: raw.role ?? "cliente",
            bloqueado: raw.blocked === true || raw.bloqueado === true,
            createdAt: raw.createdAt ?? null,
          };
        })
        .sort(byCreatedDesc)
    );
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        await Promise.all([loadTecnicos(), loadUsuarios()]);
        const pagos = await getDocs(query(collection(db, "payments"), where("status", "==", "reported")));
        setPagosRevision(pagos.size);
      } catch (e) {
        console.error(e);
        setError("No pudimos cargar todos los datos. Revisa tus permisos de administrador.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, loadTecnicos, loadUsuarios]);

  if (!isAdmin) return null;
  if (loading) return <Loader label="Cargando panel…" />;

  const publicados = tecnicos.filter((t) => t.estado === "publicado").length;
  const bloqueados = usuarios.filter((u) => u.bloqueado).length;

  return (
    <div>
      <PageHeader title="Administración" subtitle="Gestiona técnicos y usuarios de la plataforma" />

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {notice && <Alert tone="success" className="mb-4" onClose={() => setNotice("")}>{notice}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Wrench} label="Técnicos publicados" value={publicados} sub={`de ${tecnicos.length} registrados`} />
        <Kpi icon={Users} label="Usuarios" value={usuarios.length} sub={`${usuarios.filter((u) => u.role === "cliente").length} clientes`} />
        <Kpi icon={Wallet} label="Pagos en revisión" value={pagosRevision ?? "—"} sub="esperando al técnico" warn={pagosRevision > 0} />
        <Kpi icon={ShieldBan} label="Cuentas bloqueadas" value={bloqueados} sub="no pueden iniciar sesión" />
      </div>

      <Segmented
        className="mt-6"
        label="Sección"
        value={tab}
        onChange={setTab}
        items={[
          { value: "tecnicos", label: `Técnicos · ${tecnicos.length}` },
          { value: "usuarios", label: `Usuarios · ${usuarios.length}` },
        ]}
      />

      <div className="mt-4">
        {tab === "tecnicos" ? (
          <TecnicosTable data={tecnicos} reload={loadTecnicos} onNotice={setNotice} onError={setError} />
        ) : (
          <UsuariosTable data={usuarios} reload={loadUsuarios} onNotice={setNotice} onError={setError} />
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted">{label}</p>
        <Icon className="h-4 w-4 text-subtle" aria-hidden="true" />
      </div>
      <p className={cx("mt-2 text-[26px] font-semibold", warn && "text-warn")}>{value}</p>
      <p className="mt-1 text-xs text-subtle">{sub}</p>
    </Card>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="flex h-10 min-w-[220px] flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-subtle focus-within:border-brand">
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle" />
    </label>
  );
}

/* ---------------- Técnicos ---------------- */
function TecnicosTable({ data, reload, onNotice, onError }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [busyId, setBusyId] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((t) => {
      if (estado && t.estado !== estado) return false;
      if (!term) return true;
      return [t.nombre, t.ciudad, ...(t.especialidades || [])].filter(Boolean).some((x) => String(x).toLowerCase().includes(term));
    });
  }, [data, q, estado]);

  async function run(t, fn, okText) {
    setBusyId(t.id);
    try {
      await fn();
      await reload();
      onNotice(okText);
    } catch (e) {
      console.error(e);
      onError("No se pudo actualizar el técnico.");
    } finally {
      setBusyId(null);
    }
  }

  // Publicar / ocultar del catálogo (campo `publicado`, el que lee el catálogo)
  const togglePublish = (t) =>
    run(
      t,
      () => updateDoc(doc(db, "technicians", t.id), { publicado: t.estado !== "publicado", updatedAt: serverTimestamp() }),
      t.estado === "publicado" ? `Ocultamos a ${t.nombre}.` : `Publicamos a ${t.nombre}.`
    );

  // Bloquear: oculta del catálogo y bloquea la cuenta del dueño del perfil
  const toggleBlock = (t) => {
    const bloquear = t.estado !== "bloqueado";
    const pregunta = bloquear
      ? `¿Bloquear a ${t.nombre}? Se ocultará del catálogo y no podrá iniciar sesión.`
      : `¿Desbloquear a ${t.nombre}? Podrá iniciar sesión y volver a publicar su perfil.`;
    if (!window.confirm(pregunta)) return;
    run(
      t,
      async () => {
        const batch = writeBatch(db);
        batch.update(doc(db, "technicians", t.id), { blocked: bloquear, ...(bloquear ? { publicado: false } : {}), updatedAt: serverTimestamp() });
        batch.set(doc(db, "users", t.uid || t.id), { blocked: bloquear, updatedAt: serverTimestamp() }, { merge: true });
        await batch.commit();
      },
      bloquear ? `Bloqueamos a ${t.nombre}.` : `Desbloqueamos a ${t.nombre}.`
    );
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Nombre, ciudad o especialidad" />
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Estado
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-10 w-auto">
            <option value="">Todos</option>
            <option value="publicado">Publicado</option>
            <option value="revision">Sin publicar</option>
            <option value="bloqueado">Bloqueado</option>
          </Select>
        </label>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#FAFAFA] text-left text-muted">
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Técnico</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Especialidad</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Ciudad</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Calificación</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Estado</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No hay técnicos con esos filtros.</td></tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-[#F4F4F5] last:border-0">
                <td className="px-4 py-2.5">
                  <a href={techPath(t)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 font-medium hover:text-brand-ink">
                    <Avatar name={t.nombre} src={t.fotoURL} size={28} />
                    {t.nombre || "Sin nombre"}
                  </a>
                </td>
                <td className="px-4 py-2.5">{(t.especialidades || [])[0] || "—"}{(t.especialidades || []).length > 1 && <span className="text-subtle"> +{t.especialidades.length - 1}</span>}</td>
                <td className="px-4 py-2.5">{t.ciudad || "—"}</td>
                <td className="px-4 py-2.5"><Rating value={t.ratingPromedio} count={t["reseñasCount"]} /></td>
                <td className="px-4 py-2.5"><Badge tone={ESTADO[t.estado].tone}>{ESTADO[t.estado].label}</Badge></td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => togglePublish(t)} disabled={t.estado === "bloqueado" || busyId === t.id}>
                      {t.estado === "publicado" ? "Ocultar" : "Publicar"}
                    </Button>
                    <Button size="sm" variant={t.estado === "bloqueado" ? "secondary" : "danger"} onClick={() => toggleBlock(t)} disabled={busyId === t.id}>
                      {t.estado === "bloqueado" ? "Desbloquear" : "Bloquear"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-subtle">{rows.length} de {data.length} técnicos</p>
    </>
  );
}

/* ---------------- Usuarios ---------------- */
function UsuariosTable({ data, reload, onNotice, onError }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [busyId, setBusyId] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((u) => {
      if (role && u.role !== role) return false;
      if (!term) return true;
      return u.nombre?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
    });
  }, [data, q, role]);

  async function toggleBlock(u) {
    const bloquear = !u.bloqueado;
    if (!window.confirm(bloquear ? `¿Bloquear a ${u.nombre || u.email}?` : `¿Desbloquear a ${u.nombre || u.email}?`)) return;
    setBusyId(u.id);
    try {
      await updateDoc(doc(db, "users", u.id), { blocked: bloquear, updatedAt: serverTimestamp() });
      await reload();
      onNotice(bloquear ? "Usuario bloqueado." : "Usuario desbloqueado.");
    } catch (e) {
      console.error(e);
      onError("No se pudo actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Nombre o correo" />
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Rol
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 w-auto">
            <option value="">Todos</option>
            <option value="cliente">Cliente</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Admin</option>
          </Select>
        </label>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#FAFAFA] text-left text-muted">
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Usuario</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Correo</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Teléfono</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Rol</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium">Estado</th>
              <th scope="col" className="border-b border-line px-4 py-2.5 font-medium"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No hay usuarios con esos filtros.</td></tr>
            )}
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[#F4F4F5] last:border-0">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5 font-medium">
                    <Avatar name={u.nombre || u.email} size={28} />
                    {u.nombre || "Sin nombre"}
                  </span>
                </td>
                <td className="px-4 py-2.5">{u.email || "—"}</td>
                <td className="px-4 py-2.5">{u.telefono || "—"}</td>
                <td className="px-4 py-2.5"><Badge tone="brand">{ROLE_LABEL[u.role] || u.role}</Badge></td>
                <td className="px-4 py-2.5">{u.bloqueado ? <Badge tone="danger">Bloqueado</Badge> : <Badge tone="success">Activo</Badge>}</td>
                <td className="px-4 py-2 text-right">
                  {u.role !== "admin" && (
                    <Button size="sm" variant={u.bloqueado ? "secondary" : "danger"} onClick={() => toggleBlock(u)} disabled={busyId === u.id}>
                      {u.bloqueado ? "Desbloquear" : "Bloquear"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-subtle">{rows.length} de {data.length} usuarios</p>
    </>
  );
}
