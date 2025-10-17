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
    <aside className="sticky top-20 bg-white/95 border rounded-2xl p-4 h-fit shadow-sm" aria-label="Barra de filtros">
      {/* Header: título + limpiar (botón redondeado con icono) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold flex items-center gap-3">
            <span className="inline-block px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-sm">Filtros</span>
            <span className="text-xs text-gray-500">Ajusta y filtra</span>
          </h4>
        </div>

        <button
          type="button"
          onClick={limpiar}
          className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition disabled:opacity-50"
          aria-label="Limpiar filtros"
          disabled={!!loading}
        >
          <X className="w-4 h-4 text-gray-600" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Búsqueda */}
      <label className="text-sm font-medium" htmlFor="f-q">Buscar</label>
      <input
        id="f-q"
        type="text"
        value={draft.q}
        onChange={(e) => onDraftChange({ q: e.target.value })}
        onKeyDown={onSearchKeyDown}
        placeholder="Nombre, palabras clave…"
        className="w-full border rounded-lg px-3 py-2 mb-3 disabled:opacity-50"
        autoComplete="off"
        aria-label="Buscar por texto"
        disabled={!!loading}
      />

      {/* Especialidad */}
      <label className="text-sm font-medium" htmlFor="f-esp">Especialidad</label>
      <select
        id="f-esp"
        className="w-full border rounded-lg px-3 py-2 mb-3 disabled:opacity-50"
        value={draft.especialidad ?? ""}
        onChange={(e) => onDraftChange({ especialidad: e.target.value || null })}
        disabled={!!loading}
      >
        <option value="">Todas</option>
        {especialidadesUnicas.map(({ label, c }) => (
          <option key={label} value={label}>{label} {c ? `(${c})` : ""}</option>
        ))}
      </select>

      {/* Ciudad */}
      <label className="text-sm font-medium" htmlFor="f-ciudad">Ciudad</label>
      <select
        id="f-ciudad"
        className="w-full border rounded-lg px-3 py-2 mb-3 disabled:opacity-50"
        value={draft.ciudad ?? ""}
        onChange={(e) => onDraftChange({ ciudad: e.target.value || null })}
        disabled={!!loading}
      >
        <option value="">Todas</option>
        {ciudadesUnicas.map(({ label, c }) => (
          <option key={label} value={label}>{label} {c ? `(${c})` : ""}</option>
        ))}
      </select>

      {/* Rating mínimo */}
      <label className="text-sm font-medium" htmlFor="f-rating">Rating mínimo</label>
      <select
        id="f-rating"
        className="w-full border rounded-lg px-3 py-2 mb-3 disabled:opacity-50"
        value={Number(draft.minRating) || 0}
        onChange={(e) => onDraftChange({ minRating: Number(e.target.value) })}
        disabled={!!loading}
      >
        {[0, 3, 4, 4.5].map((r) => (
          <option key={r} value={r}>{r === 0 ? "Todos" : `${r}+ estrellas`}</option>
        ))}
      </select>

      {/* Solo disponibles */}
      <div className="mb-3 flex items-center justify-between">
        <label htmlFor="f-disponible" className="text-sm font-medium">Solo disponibles</label>
        <input
          id="f-disponible"
          type="checkbox"
          checked={!!draft.disponibleSolo}
          onChange={(e) => onDraftChange({ disponibleSolo: e.target.checked })}
          className="toggle"
          aria-label="Mostrar solo técnicos disponibles"
          disabled={!!loading}
        />
      </div>

      {/* Solo 5.0 */}
      <div className="mb-4 flex items-center justify-between">
        <label htmlFor="f-perfect" className="text-sm font-medium">Solo 5.0</label>
        <input
          id="f-perfect"
          type="checkbox"
          checked={!!draft.perfectRating}
          onChange={(e) => onDraftChange({ perfectRating: e.target.checked })}
          className="checkbox"
          aria-label="Mostrar solo técnicos con calificación 5.0"
          disabled={!!loading}
        />
      </div>

      {/* Rango de precios */}
      {hayTarifa && (
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Rango de precios</label>

          {/* sliders */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{money(priceRange.min)}</span>
              <span>{money(priceRange.max)}</span>
            </div>
            <input
              type="range"
              min={precios.min}
              max={precios.max}
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="w-full"
              disabled={precios.min === precios.max || !!loading}
              aria-label="Precio mínimo"
            />
            <input
              type="range"
              min={precios.min}
              max={precios.max}
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="w-full"
              disabled={precios.min === precios.max || !!loading}
              aria-label="Precio máximo"
            />
          </div>

          {/* inputs numéricos vinculados */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              className="border rounded-lg px-2 py-1 disabled:opacity-50"
              value={priceRange.min}
              min={precios.min}
              max={precios.max}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              aria-label="Ingresar precio mínimo"
              disabled={!!loading}
            />
            <input
              type="number"
              className="border rounded-lg px-2 py-1 disabled:opacity-50"
              value={priceRange.max}
              min={precios.min}
              max={precios.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              aria-label="Ingresar precio máximo"
              disabled={!!loading}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {money(priceRange.min)} – {money(priceRange.max)}
          </p>
        </div>
      )}

      {/* Ordenar por */}
      <label className="text-sm font-medium" htmlFor="f-orden">Ordenar por</label>
      <select
        id="f-orden"
        className="w-full border rounded-lg px-3 py-2 mb-4 disabled:opacity-50"
        value={draft.orden}
        onChange={(e) => onDraftChange({ orden: e.target.value })}
        disabled={!!loading}
      >
        <option value="rating">Mejor calificados</option>
        {showPriceSort && (
          <>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </>
        )}
      </select>

      <button
        type="button"
        className="w-full rounded-xl py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-400 text-white font-medium shadow-md hover:from-teal-700 transition disabled:opacity-50"
        onClick={onApply}
        aria-label="Aplicar filtros"
        disabled={!!loading}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" aria-hidden="true" />
        ) : (
          <Filter className="w-4 h-4 text-white" />
        )}
        <span>Aplicar filtros</span>
      </button>
    </aside>
  );
}
