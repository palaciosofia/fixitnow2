// src/Components/Common/Catalog/TechnicianCard.jsx
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Tag as TagIcon, CheckCircle, ArrowRight } from "lucide-react";

const money = (v, moneda = "USD") =>
  typeof v === "number"
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
        maximumFractionDigits: 0,
      }).format(v)
    : "A convenir";

export default function TechnicianCard({ t }) {
  const nav = useNavigate();
  const tid = t?.id || t?.uid || null;

  const foto =
    t?.fotoURL || t?.fotoUrl || "https://via.placeholder.com/640x360?text=Tecnico";
  const nombre = t?.nombre || "Técnico";
  const ciudad = t?.ciudad || "—";
  const especArr = Array.isArray(t?.especialidades) ? t.especialidades : [];
  const rating =
    Number.isFinite(t?.ratingPromedio) ? Number(t.ratingPromedio).toFixed(1) : "—";
  const count = Number.isFinite(t?.["reseñasCount"]) ? t["reseñasCount"] : 0;

  const tarifa =
    typeof t?.tarifaBase === "number"
      ? t.tarifaBase
      : typeof t?.tarifa === "number"
      ? t.tarifa
      : null;

  const perfilPath = t?.slug ? `/tecnicos/${t.slug}` : `/tecnicos/${tid || ""}`;

  const goReservar = () => {
    if (!tid) return;
    nav(`/agendar/${tid}`);
  };

  return (
    <article className="group bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100 hover:border-emerald-200 min-h-[340px] flex flex-col">
      {/* Imagen - Mejorada con overlay gradiente */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
        <img
          src={foto}
          alt={`Foto de ${nombre}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Overlay gradiente oscuro en la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Rating Badge - Superior derecha */}
        <div className="absolute right-4 top-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full px-3 py-2 flex items-center gap-1 shadow-lg border-2 border-white">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-bold text-sm">
            {rating}
            {count ? (
              <span className="ml-1 text-xs opacity-90">({count})</span>
            ) : null}
          </span>
        </div>

        {/* Verificado Badge - Superior izquierda */}
        {t?.verificado && (
          <div className="absolute left-4 top-4 bg-emerald-500 text-white rounded-full px-3 py-2 flex items-center gap-1 shadow-lg border-2 border-white font-semibold text-xs">
            <CheckCircle className="w-4 h-4" />
            Verificado
          </div>
        )}
      </div>

      {/* Contenido - Con mejor espaciado */}
      <div className="p-6 md:p-7 flex flex-col flex-grow">
        {/* Nombre y ubicación */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 leading-tight" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            {nombre}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">{ciudad}</span>
          </div>
        </div>

        {/* Descripción - Mejor legibilidad */}
        <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed flex-grow">
          {t.bioCorta || t.descripcion || "Sin descripción disponible."}
        </p>

        {/* Especialidades - Mejor presentación */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Especialidades</p>
          <div className="flex flex-wrap gap-2">
            {especArr.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-3 py-1.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1.5"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                {s}
              </span>
            ))}
            {especArr.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-semibold">
                +{especArr.length - 3} más
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5"></div>

        {/* Footer: Precio + Botones */}
        <div className="space-y-3">
          {/* Precio */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarifa base</span>
            <span className="text-lg font-black text-emerald-600" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              {tarifa !== null
                ? money(tarifa, t?.moneda || "USD")
                : "A convenir"}
            </span>
          </div>

          {/* Botones - Full width mejorados */}
          <div className="flex gap-3 pt-2">
            <Link
              to={perfilPath}
              className="flex-1 text-center px-4 py-3 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-100 hover:border-emerald-400 text-sm font-semibold text-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
              aria-label={`Ver perfil de ${nombre}`}
            >
              <span>Perfil</span>
            </Link>

            <button
              type="button"
              onClick={goReservar}
              disabled={!tid}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group/btn shadow-lg hover:shadow-xl"
              aria-label={`Reservar con ${nombre}`}
              title={tid ? "Reservar ahora" : "Falta id del técnico"}
            >
              <span>Reservar</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
