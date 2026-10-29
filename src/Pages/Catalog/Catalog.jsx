// src/Pages/Catalog/Catalog.jsx
// Catálogo de técnicos: chips de especialidad, búsqueda, orden y filtros extra.
// Los filtros viven en la URL (?q=&esp=&orden=…) para poder compartir la búsqueda.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, SearchX, Search } from "lucide-react";
import TechnicianCard from "../../Components/Common/Catalog/TechnicianCard";
import { fetchTechniciansPage } from "../../services/technicians";
import { Alert, Button, EmptyState, Field, Input, PageHeader, Select } from "../../ui";
import { cx } from "../../ui/cx";
import { ESPECIALIDADES, ESPECIALIDADES_DESTACADAS, priceFrom } from "../../utils/catalog";

const EMPTY_FILTERS = {
  q: "",
  especialidad: null,
  ciudad: null,
  minRating: 0,
  minPrecio: null,
  maxPrecio: null,
  orden: "rating", // "rating" | "precio_asc" | "precio_desc"
  disponibleSolo: false,
};

function filtersFromParams(sp) {
  const ordenParam = sp.get("orden") || "rating";
  const num = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    q: (sp.get("q") || "").trim(),
    especialidad: sp.get("esp") || null,
    ciudad: sp.get("ciudad") || null,
    minRating: Number(sp.get("minRating") || 0) || 0,
    minPrecio: num(sp.get("minPrecio")),
    maxPrecio: num(sp.get("maxPrecio")),
    orden: ["precio_asc", "precio_desc"].includes(ordenParam) ? ordenParam : "rating",
    disponibleSolo: sp.get("disponible") === "1",
  };
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [showMore, setShowMore] = useState(false);
  const [draft, setDraft] = useState({ minPrecio: "", maxPrecio: "", minRating: 0, ciudad: "" });

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");
  const reqIdRef = useRef(0);

  // Si cambia la URL desde fuera (buscador del encabezado), actualiza los filtros
  const paramsKey = searchParams.toString();
  const lastWritten = useRef(paramsKey);
  useEffect(() => {
    if (paramsKey !== lastWritten.current) {
      lastWritten.current = paramsKey;
      setFilters(filtersFromParams(new URLSearchParams(paramsKey)));
    }
  }, [paramsKey]);

  // Filtros → URL
  useEffect(() => {
    const next = {};
    if (filters.q?.trim()) next.q = filters.q.trim();
    if (filters.especialidad) next.esp = filters.especialidad;
    if (filters.ciudad) next.ciudad = filters.ciudad;
    if (filters.minRating) next.minRating = String(filters.minRating);
    if (filters.minPrecio != null) next.minPrecio = String(filters.minPrecio);
    if (filters.maxPrecio != null) next.maxPrecio = String(filters.maxPrecio);
    if (filters.orden !== "rating") next.orden = filters.orden;
    if (filters.disponibleSolo) next.disponible = "1";
    const qs = new URLSearchParams(next).toString();
    lastWritten.current = qs;
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  // Carga desde Firestore cuando cambian los filtros que se aplican en el servidor
  useEffect(() => {
    const run = async () => {
      const myReq = ++reqIdRef.current;
      setLoading(true);
      setError("");
      setInitialLoaded(false);
      try {
        const { items: first, cursor: cur } = await fetchTechniciansPage({
          especialidad: filters.especialidad,
          ciudad: filters.ciudad,
          orden: filters.orden,
          disponibleSolo: filters.disponibleSolo,
          pageSize: 12,
          cursor: null,
        });
        if (reqIdRef.current !== myReq) return;
        setItems((first || []).map(normalizeTechId));
        setCursor(cur);
      } catch (e) {
        if (reqIdRef.current !== myReq) return;
        console.error(e);
        setError("No pudimos cargar el catálogo. Intenta de nuevo.");
      } finally {
        if (reqIdRef.current === myReq) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    };
    run();
  }, [filters.especialidad, filters.ciudad, filters.orden, filters.disponibleSolo]);

  const loadMore = async () => {
    if (!cursor) return;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError("");
    try {
      const { items: more, cursor: next } = await fetchTechniciansPage({
        especialidad: filters.especialidad,
        ciudad: filters.ciudad,
        orden: filters.orden,
        disponibleSolo: filters.disponibleSolo,
        pageSize: 12,
        cursor,
      });
      if (reqIdRef.current !== myReq) return;
      setItems((prev) => mergeUniqueById(prev, (more || []).map(normalizeTechId)));
      setCursor(next);
    } catch (e) {
      if (reqIdRef.current !== myReq) return;
      console.error(e);
      setError("No pudimos cargar más resultados.");
    } finally {
      if (reqIdRef.current === myReq) setLoading(false);
    }
  };

  // Filtros que se aplican en el navegador: búsqueda, calificación y precio
  const debouncedQ = useDebouncedValue(filters.q, 300);
  const view = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    return items.filter((t) => {
      if (filters.minRating) {
        const r = Number(t?.ratingPromedio ?? 0);
        if (!Number.isFinite(r) || r < Number(filters.minRating)) return false;
      }
      const precio = priceFrom(t) || null;
      if (filters.minPrecio != null && precio != null && precio < filters.minPrecio) return false;
      if (filters.maxPrecio != null && precio != null && precio > filters.maxPrecio) return false;
      if (!q) return true;
      const campos = [
        t.nombre,
        t.descripcion,
        t.bioCorta,
        t.ciudad,
        ...(t.especialidades || []),
        ...(t.zonasCobertura || []),
        ...(t.servicios || []).map((s) => s?.nombre),
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return campos.some((c) => c.includes(q));
    });
  }, [items, debouncedQ, filters.minRating, filters.minPrecio, filters.maxPrecio]);

  const set = (partial) => setFilters((f) => ({ ...f, ...partial }));

  const openMore = () => {
    setDraft({
      minPrecio: filters.minPrecio ?? "",
      maxPrecio: filters.maxPrecio ?? "",
      minRating: filters.minRating || 0,
      ciudad: filters.ciudad || "",
    });
    setShowMore((v) => !v);
  };

  const applyMore = (e) => {
    e.preventDefault();
    set({
      minPrecio: draft.minPrecio === "" ? null : Number(draft.minPrecio),
      maxPrecio: draft.maxPrecio === "" ? null : Number(draft.maxPrecio),
      minRating: Number(draft.minRating) || 0,
      ciudad: draft.ciudad.trim() || null,
    });
    setShowMore(false);
  };

  const extraCount =
    (filters.minPrecio != null ? 1 : 0) +
    (filters.maxPrecio != null ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.ciudad ? 1 : 0);
  const hasAnyFilter = extraCount > 0 || filters.q || filters.especialidad || filters.disponibleSolo;

  // Chips: las destacadas + la elegida si no está entre ellas
  const chips = ESPECIALIDADES_DESTACADAS.includes(filters.especialidad) || !filters.especialidad
    ? ESPECIALIDADES_DESTACADAS
    : [filters.especialidad, ...ESPECIALIDADES_DESTACADAS];

  return (
    <div>
      <PageHeader
        title={filters.especialidad || "Técnicos"}
        subtitle="Encuentra quién te ayude en Barranquilla y alrededores"
        actions={
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Ordenar
            <Select value={filters.orden} onChange={(e) => set({ orden: e.target.value })} className="h-10 w-auto font-medium">
              <option value="rating">Mejor calificados</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
            </Select>
          </label>
        }
      />

      {/* Barra de filtros */}
      <div className="rounded-[14px] border border-line bg-white p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-10 min-w-[220px] flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-line px-3 text-subtle focus-within:border-brand">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Buscar por nombre, servicio o barrio</span>
            <input
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Nombre, servicio o barrio"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle"
            />
          </label>
          <label className="flex min-h-10 items-center gap-2 px-1.5 text-[13px] font-medium">
            <input
              type="checkbox"
              checked={filters.disponibleSolo}
              onChange={(e) => set({ disponibleSolo: e.target.checked })}
              className="h-[18px] w-[18px] accent-brand"
            />
            Solo disponibles
          </label>
          <Button variant={showMore || extraCount ? "soft" : "secondary"} size="sm" className="h-10" onClick={openMore} aria-expanded={showMore} aria-controls="mas-filtros">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Más filtros{extraCount ? ` · ${extraCount}` : ""}
          </Button>
        </div>

        <div className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0" role="group" aria-label="Especialidad">
          <button
            type="button"
            aria-pressed={!filters.especialidad}
            onClick={() => set({ especialidad: null })}
            className={cx("h-9 rounded-[9px] px-3.5 text-[13px]", !filters.especialidad ? "bg-brand font-medium text-white" : "bg-brand-soft text-brand-ink hover:bg-[#E2DFFD]")}
          >
            Todas
          </button>
          {chips.map((e) => {
            const active = filters.especialidad === e;
            return (
              <button
                key={e}
                type="button"
                aria-pressed={active}
                onClick={() => set({ especialidad: active ? null : e })}
                className={cx("h-9 rounded-[9px] px-3.5 text-[13px]", active ? "bg-brand font-medium text-white" : "bg-brand-soft text-brand-ink hover:bg-[#E2DFFD]")}
              >
                {e}
              </button>
            );
          })}
        </div>

        {showMore && (
          <form id="mas-filtros" onSubmit={applyMore} className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Especialidad">
              {(id) => (
                <Select id={id} value={filters.especialidad || ""} onChange={(e) => set({ especialidad: e.target.value || null })}>
                  <option value="">Todas</option>
                  {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Ciudad">
              {(id) => <Input id={id} value={draft.ciudad} onChange={(e) => setDraft((d) => ({ ...d, ciudad: e.target.value }))} placeholder="Barranquilla" />}
            </Field>
            <Field label="Precio mínimo">
              {(id) => <Input id={id} type="number" min="0" step="5000" inputMode="numeric" value={draft.minPrecio} onChange={(e) => setDraft((d) => ({ ...d, minPrecio: e.target.value }))} placeholder="$ 0" />}
            </Field>
            <Field label="Precio máximo">
              {(id) => <Input id={id} type="number" min="0" step="5000" inputMode="numeric" value={draft.maxPrecio} onChange={(e) => setDraft((d) => ({ ...d, maxPrecio: e.target.value }))} placeholder="Sin límite" />}
            </Field>
            <Field label="Calificación mínima">
              {(id) => (
                <Select id={id} value={draft.minRating} onChange={(e) => setDraft((d) => ({ ...d, minRating: e.target.value }))}>
                  <option value={0}>Cualquiera</option>
                  <option value={4}>4 ★ o más</option>
                  <option value={4.5}>4.5 ★ o más</option>
                  <option value={5}>Solo 5 ★</option>
                </Select>
              )}
            </Field>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
              <Button type="button" variant="ghost" onClick={() => { setFilters(EMPTY_FILTERS); setShowMore(false); }}>Limpiar todo</Button>
              <Button type="submit">Aplicar filtros</Button>
            </div>
          </form>
        )}
      </div>

      {error && <Alert tone="danger" className="mt-4">{error}</Alert>}

      {/* Resultados */}
      {!initialLoaded ? (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[290px] animate-pulse rounded-[14px] border border-line bg-white" />
          ))}
        </div>
      ) : view.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title="No encontramos técnicos con esos filtros"
          text="Prueba con otra especialidad o quita algún filtro."
          action={hasAnyFilter && <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>Quitar filtros</Button>}
        />
      ) : (
        <>
          <p className="mt-4 text-[13px] text-subtle" aria-live="polite">
            {view.length} {view.length === 1 ? "técnico" : "técnicos"}
          </p>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {view.map((t) => (
              <TechnicianCard key={t.id} t={t} />
            ))}
          </div>
        </>
      )}

      {initialLoaded && cursor && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} loading={loading}>Cargar más técnicos</Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */
function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function getTechId(t) {
  return t?.id || t?.uid || null;
}

function normalizeTechId(t) {
  const id = getTechId(t);
  return id ? { ...t, id } : t;
}

/** Une páginas sin duplicar técnicos */
function mergeUniqueById(prev = [], next = []) {
  const seen = new Set(prev.map(getTechId).filter(Boolean));
  const merged = [...prev];
  for (const it of next) {
    const k = getTechId(it);
    if (k && !seen.has(k)) {
      merged.push(it);
      seen.add(k);
    }
  }
  return merged;
}
