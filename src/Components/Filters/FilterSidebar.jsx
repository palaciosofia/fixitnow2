// src/Components/Filters/FilterSidebar.jsx
import { useMemo, useState, useEffect } from "react";
import { X, Filter } from "lucide-react";

export default function FilterSidebar({
  allItems = [],
  draft,
  onDraftChange,
  onApply,
  onClear,
  showPriceSort = true,
  loading = false, // <-- NUEVO
}) {
  const items = Array.isArray(allItems) ? allItems : [];
  const money = (n) =>
    typeof n === "number" && Number.isFinite(n)
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
      : "—";

  // Opciones derivadas del lote visible (server + client)
  const especialidadesBase = useMemo(() => {
    const count = new Map();
    items.forEach((t) => (t?.especialidades || []).forEach((e) => count.set(e, (count.get(e) || 0) + 1)));
    return Array.from(count.entries())
      .map(([label, c]) => ({ label, c }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  const ciudadesBase = useMemo(() => {
    const count = new Map();
    items.forEach((t) => {
      if (t?.ciudad) count.set(t.ciudad, (count.get(t.ciudad) || 0) + 1);
    });
    return Array.from(count.entries())
      .map(([label, c]) => ({ label, c }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  // Incluye la opción actualmente seleccionada aunque no aparezca en el lote (p. ej. 0 resultados)
  const especialidadesUnicas = useMemo(() => {
    const list = [...especialidadesBase];
    if (draft?.especialidad && !list.some((x) => x.label === draft.especialidad)) {
      list.unshift({ label: draft.especialidad, c: 0 });
    }
    return list;
  }, [especialidadesBase, draft?.especialidad]);

  const ciudadesUnicas = useMemo(() => {
    const list = [...ciudadesBase];
    if (draft?.ciudad && !list.some((x) => x.label === draft.ciudad)) {
      list.unshift({ label: draft.ciudad, c: 0 });
    }
    return list;
  }, [ciudadesBase, draft?.ciudad]);

  // Rango de precios basado en tarifaBase (fallback a tarifa)
  const precios = useMemo(() => {
    const values = items
      .map((t) => (typeof t?.tarifaBase === "number" ? t.tarifaBase : (typeof t?.tarifa === "number" ? t.tarifa : null)))
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!values.length) return { min: 0, max: 0 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [items]);

  const hayTarifa = precios.max > 0;

  // Estado local vinculado a draft para sliders/inputs
  const [priceRange, setPriceRange] = useState({
    min: draft.minPrecio ?? precios.min,
    max: draft.maxPrecio ?? precios.max,
  });
  useEffect(() => {
    setPriceRange({
      min: draft.minPrecio ?? precios.min,
      max: draft.maxPrecio ?? precios.max,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.minPrecio, draft.maxPrecio, precios.min, precios.max]);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const handlePriceChange = (type, value) => {
    const raw = Number(value);
    const v = Number.isFinite(raw) ? raw : (type === "min" ? precios.min : precios.max);
    const clamped = clamp(v, precios.min, precios.max);

    const next = type === "min"
      ? { min: Math.min(clamped, priceRange.max), max: priceRange.max }
      : { min: priceRange.min, max: Math.max(clamped, priceRange.min) };

    setPriceRange(next);
    onDraftChange({
      minPrecio: next.min,
      maxPrecio: next.max,
    });
  };

  const limpiar = () => onClear?.();

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") onApply?.();
  };

  return (
    <aside className="sticky top-20 bg-gradient-to-b from-white via-emerald-50/30 to-white rounded-3xl p-6 h-fit shadow-lg border-2 border-emerald-100/50 backdrop-blur-sm" aria-label="Barra de filtros">
      {/* Header con estilo mejorado */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0px'}}>
                Filtros
              </h4>
              <p className="text-xs text-gray-500 font-medium" style={{fontFamily: 'DM Sans, sans-serif'}}>Encuentra lo perfecto</p>
            </div>
          </div>

          <button
            type="button"
            onClick={limpiar}
            className="p-2 rounded-full bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Limpiar filtros"
            disabled={!!loading}
            title="Limpiar todos los filtros"
          >
            <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
          </button>
        </div>
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent rounded-full"></div>
      </div>

      {/* Búsqueda mejorada */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block" htmlFor="f-q" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Buscar</label>
        <input
          id="f-q"
          type="text"
          value={draft.q}
          onChange={(e) => onDraftChange({ q: e.target.value })}
          onKeyDown={onSearchKeyDown}
          placeholder="Nombre, especialidad…"
          className="w-full disabled:opacity-50"
          autoComplete="off"
          aria-label="Buscar por texto"
          disabled={!!loading}
        />
      </div>

      {/* Especialidad mejorada */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block" htmlFor="f-esp" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Especialidad</label>
        <select
          id="f-esp"
          className="w-full"
          value={draft.especialidad ?? ""}
          onChange={(e) => onDraftChange({ especialidad: e.target.value || null })}
          disabled={!!loading}
        >
          <option value="">Todas las especialidades</option>
          {especialidadesUnicas.map(({ label, c }) => (
            <option key={label} value={label}>{label} {c ? `(${c})` : ""}</option>
          ))}
        </select>
      </div>

      {/* Ciudad mejorada */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block" htmlFor="f-ciudad" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Ciudad</label>
        <select
          id="f-ciudad"
          className="w-full"
          value={draft.ciudad ?? ""}
          onChange={(e) => onDraftChange({ ciudad: e.target.value || null })}
          disabled={!!loading}
        >
          <option value="">Todas las ciudades</option>
          {ciudadesUnicas.map(({ label, c }) => (
            <option key={label} value={label}>{label} {c ? `(${c})` : ""}</option>
          ))}
        </select>
      </div>

      {/* Rating mínimo mejorado */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block" htmlFor="f-rating" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Calificación mínima</label>
        <select
          id="f-rating"
          className="w-full"
          value={Number(draft.minRating) || 0}
          onChange={(e) => onDraftChange({ minRating: Number(e.target.value) })}
          disabled={!!loading}
        >
          {[0, 3, 4, 4.5].map((r) => (
            <option key={r} value={r}>{r === 0 ? "Todos" : `${r}+ ⭐ estrellas`}</option>
          ))}
        </select>
      </div>

      {/* Checkboxes mejorados */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200/50 hover:border-emerald-300 transition-all group cursor-pointer">
          <label htmlFor="f-disponible" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1" style={{fontFamily: 'DM Sans, sans-serif'}}>
            Solo disponibles
          </label>
          <input
            id="f-disponible"
            type="checkbox"
            checked={!!draft.disponibleSolo}
            onChange={(e) => onDraftChange({ disponibleSolo: e.target.checked })}
            className="w-5 h-5 rounded-lg border-2 border-emerald-500 accent-emerald-600 cursor-pointer"
            aria-label="Mostrar solo técnicos disponibles"
            disabled={!!loading}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200/50 hover:border-yellow-300 transition-all group cursor-pointer">
          <label htmlFor="f-perfect" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1" style={{fontFamily: 'DM Sans, sans-serif'}}>
            Solo 5.0 ⭐
          </label>
          <input
            id="f-perfect"
            type="checkbox"
            checked={!!draft.perfectRating}
            onChange={(e) => onDraftChange({ perfectRating: e.target.checked })}
            className="w-5 h-5 rounded-lg border-2 border-yellow-500 accent-yellow-600 cursor-pointer"
            aria-label="Mostrar solo técnicos con calificación 5.0"
            disabled={!!loading}
          />
        </div>
      </div>

      {/* Rango de precios mejorado */}
      {hayTarifa && (
        <div className="mb-6 p-4 bg-white border-2 border-gray-200 rounded-2xl">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 block" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Rango de precios</label>

          {/* sliders */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm font-bold text-emerald-700" style={{fontFamily: 'DM Sans, sans-serif'}}>
              <span>{money(priceRange.min)}</span>
              <span>{money(priceRange.max)}</span>
            </div>
            <input
              type="range"
              min={precios.min}
              max={precios.max}
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
              disabled={precios.min === precios.max || !!loading}
              aria-label="Precio mínimo"
            />
            <input
              type="range"
              min={precios.min}
              max={precios.max}
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
              disabled={precios.min === precios.max || !!loading}
              aria-label="Precio máximo"
            />
          </div>

          {/* inputs numéricos vinculados */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 bg-gray-50"
              value={priceRange.min}
              min={precios.min}
              max={precios.max}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              aria-label="Ingresar precio mínimo"
              disabled={!!loading}
              style={{fontFamily: 'DM Sans, sans-serif'}}
            />
            <input
              type="number"
              className="border-2 border-gray-200 focus:border-emerald-500 focus:ring-0 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 bg-gray-50"
              value={priceRange.max}
              min={precios.min}
              max={precios.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              aria-label="Ingresar precio máximo"
              disabled={!!loading}
              style={{fontFamily: 'DM Sans, sans-serif'}}
            />
          </div>
        </div>
      )}

      {/* Ordenar por mejorado */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block" htmlFor="f-orden" style={{fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em'}}>Ordenar resultados</label>
        <select
          id="f-orden"
          className="w-full"
          value={draft.orden}
          onChange={(e) => onDraftChange({ orden: e.target.value })}
          disabled={!!loading}
        >
          <option value="rating">⭐ Mejor calificados</option>
          {showPriceSort && (
            <>
              <option value="precio_asc">💰 Menor precio</option>
              <option value="precio_desc">💰 Mayor precio</option>
            </>
          )}
        </select>
      </div>

      {/* Botón aplicar mejorado */}
      <button
        type="button"
        className="w-full rounded-2xl py-3 px-4 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 text-base"
        onClick={onApply}
        aria-label="Aplicar filtros"
        disabled={!!loading}
        style={{fontFamily: 'DM Sans, sans-serif'}}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" aria-hidden="true" />
            <span>Aplicando filtros...</span>
          </>
        ) : (
          <>
            <Filter className="w-5 h-5" />
            <span>Aplicar filtros</span>
          </>
        )}
      </button>
    </aside>
  );
}
