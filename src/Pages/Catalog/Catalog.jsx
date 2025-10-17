// src/Pages/Catalog/Catalog.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TechnicianCard from "../../Components/Common/Catalog/TechnicianCard";
import FilterSidebar from "../../Components/Filters/FilterSidebar";
import { fetchTechniciansPage } from "../../services/technicians";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    q: "",
    especialidad: null,
    ciudad: null,
    minRating: 0,
    minPrecio: null,
    maxPrecio: null,
    orden: "rating",       // "rating" | "precio_asc" | "precio_desc"
    disponibleSolo: false,
    perfectRating: false,
  });
  const [draft, setDraft] = useState(filters);

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null); // { primary, tie, orden } | null
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState("");

  // --- control anti-carrera (descarta respuestas viejas) ---
  const reqIdRef = useRef(0);

  // --- Lee filtros desde la URL una sola vez ---
  useEffect(() => {
    const q = (searchParams.get("q") || "").trim();
    const esp = searchParams.get("esp") || "";
    const ciudad = searchParams.get("ciudad") || "";
    const minRating = Number(searchParams.get("minRating") || 0);
    const ordenParam = searchParams.get("orden") || "rating";
    const minPrecio = searchParams.get("minPrecio");
    const maxPrecio = searchParams.get("maxPrecio");
    const disponible = searchParams.get("disponible") === "1";
    const perfect = searchParams.get("perfect") === "1";

    const parsed = {
      q,
      especialidad: esp || null,
      ciudad: ciudad || null,
      minRating: Number.isFinite(minRating) ? minRating : 0,
      minPrecio: minPrecio ? Number(minPrecio) : null,
      maxPrecio: maxPrecio ? Number(maxPrecio) : null,
      orden: ["precio_asc", "precio_desc"].includes(ordenParam) ? ordenParam : "rating",
      disponibleSolo: disponible,
      perfectRating: perfect,
    };

    setFilters(parsed);
    setDraft(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Sincroniza filtros -> URL ---
  useEffect(() => {
    const next = {};
    if (filters.q?.trim()) next.q = filters.q.trim();
    if (filters.especialidad) next.esp = filters.especialidad;
    if (filters.ciudad) next.ciudad = filters.ciudad;
    if (filters.minRating) next.minRating = String(filters.minRating);
    if (filters.minPrecio != null) next.minPrecio = String(filters.minPrecio);
    if (filters.maxPrecio != null) next.maxPrecio = String(filters.maxPrecio);
    if (filters.orden && filters.orden !== "rating") next.orden = filters.orden;
    if (filters.disponibleSolo) next.disponible = "1";
    if (filters.perfectRating) next.perfect = "1";
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  // --- Carga inicial + recargas por filtros server-side ---
  useEffect(() => {
    const run = async () => {
      const myReq = ++reqIdRef.current;
      setLoading(true);
      setError("");
      setInitialLoaded(false); // muestra skeleton en cada recarga por filtros server
      try {
        // ⚠️ al cambiar server-filtros, reiniciamos paginación
        const { items: first, cursor: cur } = await fetchTechniciansPage({
          especialidad: filters.especialidad,
          ciudad: filters.ciudad,
          orden: filters.orden,
          disponibleSolo: filters.disponibleSolo,
          pageSize: 12,
          cursor: null,
        });
        if (reqIdRef.current !== myReq) return;

        // 👇 Normaliza para garantizar id siempre (id de doc o uid)
        const normalized = (first || []).map(normalizeTechId);
        setItems(normalized);
        setCursor(cur);
      } catch (e) {
        if (reqIdRef.current !== myReq) return;
        console.error(e);
        setError("No pudimos cargar el catálogo. Intenta de nuevo.");
      } finally {
        if (reqIdRef.current !== myReq) return;
        setLoading(false);
        setInitialLoaded(true);
      }
    };
    run();
  }, [filters.especialidad, filters.ciudad, filters.orden, filters.disponibleSolo]);

  // --- Paginación (Cargar más) ---
  const loadMore = async () => {
    if (!cursor) return;
    // si cambió el orden desde que se creó el cursor, invalida
    if (cursor?.orden && cursor.orden !== filters.orden) {
      setCursor(null);
      return;
    }
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

      const normalizedMore = (more || []).map(normalizeTechId);
      setItems(prev => mergeUniqueById(prev, normalizedMore));
      setCursor(next);
    } catch (e) {
      if (reqIdRef.current !== myReq) return;
      console.error(e);
      setError("No pudimos cargar más resultados.");
    } finally {
      if (reqIdRef.current !== myReq) return;
      setLoading(false);
    }
  };

  // --- Búsqueda local y filtros locales (precio/rating/"perfect") ---
  const debouncedQ = useDebouncedValue(filters.q, 350);
  const view = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    return items.filter((t) => {
      // Perfect 5 ⭐
      if (
        filters.perfectRating &&
        !(Number.isFinite(Number(t?.ratingPromedio)) && Number(t.ratingPromedio) >= 4.999)
      ) return false;

      // Min rating
      if (filters.minRating) {
        const r = Number(t?.ratingPromedio ?? 0);
        if (!Number.isFinite(r) || r < Number(filters.minRating)) return false;
      }

      // Rango de precio (local)
      const precio = typeof t.tarifaBase === "number" ? t.tarifaBase :
                     typeof t.tarifa === "number" ? t.tarifa : null;
      if (filters.minPrecio != null && typeof precio === "number" && precio < filters.minPrecio)
        return false;
      if (filters.maxPrecio != null && typeof precio === "number" && precio > filters.maxPrecio)
        return false;

      // Búsqueda en campos básicos
      if (!q) return true;
      const campos = [
        t.nombre,
        t.descripcion,
        ...(t.tags || []),
        ...(t.especialidades || []),
        t.ciudad,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return campos.some((c) => c.includes(q));
    });
  }, [items, debouncedQ, filters.minRating, filters.minPrecio, filters.maxPrecio, filters.perfectRating]);

  // --- Handlers de filtros ---
  const onDraftChange = (partial) => setDraft((d) => ({ ...d, ...partial }));

  const onApply = () => {
    // Normaliza numéricos que pueden venir como string del <select>/<input>
    const normalized = {
      ...draft,
      minRating: Number(draft.minRating) || 0,
      minPrecio:
        draft.minPrecio === "" || draft.minPrecio == null
          ? null
          : Number(draft.minPrecio),
      maxPrecio:
        draft.maxPrecio === "" || draft.maxPrecio == null
          ? null
          : Number(draft.maxPrecio),
    };
    // reset paginación y lista antes de pedir al server
    setCursor(null);
    setItems([]);
    setFilters(normalized);
  };

  const onClear = () => {
    const cleared = {
      q: "",
      especialidad: null,
      ciudad: null,
      minRating: 0,
      minPrecio: null,
      maxPrecio: null,
      orden: "rating",
      disponibleSolo: false,
      perfectRating: false,
    };
    setDraft(cleared);
    setFilters(cleared);
    setCursor(null);
    setItems([]);
    setInitialLoaded(false); // skeleton mientras recarga
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section espectacular */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                <span className="text-3xl">🔧</span>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                <span className="text-3xl">🛠️</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Encuentra el <span className="text-yellow-300">Técnico Perfecto</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Conecta con <strong className="text-yellow-300">profesionales verificados</strong> en tu ciudad. 
              Filtra por especialidad, precio y calificaciones.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-900">✓</span>
                </div>
                <span className="font-medium">500+ Técnicos Verificados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-yellow-900">⭐</span>
                </div>
                <span className="font-medium">Calificaciones Reales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-900">⚡</span>
                </div>
                <span className="font-medium">Reserva en Minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de filtros premium */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm p-8 mb-8 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full blur-3xl opacity-60"></div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Filtros Inteligentes</h2>
                <p className="text-gray-600">Personaliza tu búsqueda y encuentra exactamente lo que necesitas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl border border-emerald-200">
                <span className="text-sm font-semibold text-emerald-800">
                  {view.length} resultado{view.length !== 1 ? 's' : ''} encontrado{view.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <button
                onClick={onClear}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-medium text-gray-700"
              >
                <span className="text-lg">🔄</span>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar mejorado */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <FilterSidebar
                allItems={items}
                draft={draft}
                onDraftChange={onDraftChange}
                onApply={onApply}
                onClear={onClear}
                showPriceSort
                loading={loading}
              />
            </div>
          </div>

          {/* Grid principal mejorado */}
          <div className="lg:col-span-3">
            {/* Loading skeleton espectacular */}
            {!initialLoaded && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-pulse">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300" />
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-3/4" />
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg" />
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-5/6" />
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/6" />
                      </div>
                      <div className="mt-6 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error state premium */}
            {error && initialLoaded && (
              <div className="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-8 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Oops! Algo salió mal</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Empty state espectacular */}
            {initialLoaded && view.length === 0 && !loading && !error && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No encontramos técnicos</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No hay técnicos que coincidan con tus filtros actuales. 
                  Prueba ajustar los rangos de precio o seleccionar otras especialidades.
                </p>
                <button
                  onClick={onClear}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}

            {/* Grid de resultados premium */}
            {view.length > 0 && (
              <>
                <div className="mb-8">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          Mostrando <span className="text-emerald-600">{view.length}</span> técnico{view.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {filters.q && (
                        <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl border border-blue-200">
                          <span className="text-sm font-medium">Filtrado por: "{filters.q}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                  {view.map((t, i) => (
                    <div 
                      key={getTechId(t) || i} 
                      className="transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl"
                      style={{
                        animationDelay: `${i * 100}ms`,
                        animation: initialLoaded ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                      }}
                    >
                      <TechnicianCard t={t} />
                    </div>
                  ))}
                </div>

                {/* Paginación espectacular */}
                <div className="flex justify-center">
                  {cursor ? (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Cargando más técnicos...
                          </>
                        ) : (
                          <>
                            <span className="text-xl">⬇️</span>
                            Cargar más técnicos
                          </>
                        )}
                      </span>
                      {!loading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                    </button>
                  ) : (
                    initialLoaded && (
                      <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🎉</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-700">
                          ¡Has visto todos los técnicos disponibles!
                        </span>
                        <p className="text-gray-500 mt-2">Prueba ajustar los filtros para ver más opciones</p>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Agregar estilos de animación */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/** Debounce */
function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  const tRef = useRef(null);
  useEffect(() => {
    clearTimeout(tRef?.current);
    tRef.current = setTimeout(() => setV(value), delay);
    return () => clearTimeout(tRef?.current);
  }, [value, delay]);
  return v;
}

/** Helpers para id consistente (id de doc o uid) */
function getTechId(t) {
  return t?.id || t?.uid || null;
}
function normalizeTechId(t) {
  const id = getTechId(t);
  return id ? { ...t, id } : t; // asegura t.id siempre que sea posible
}

/** Merge único por id para paginar sin duplicados */
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