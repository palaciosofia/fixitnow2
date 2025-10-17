// src/Components/Common/Catalog/TechnicianCard.jsx
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Tag as TagIcon } from "lucide-react";

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
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition transform hover:-translate-y-1 min-h-[260px]">
      <div className="md:flex">
        {/* Imagen */}
        <div className="md:w-1/3 relative">
          <img
            src={foto}
            alt={`Foto de ${nombre}`}
            className="w-full h-56 md:h-full object-cover"
            loading="lazy"
          />
          {/* overlay: verificado + rating */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {t?.verificado && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Verificado
              </span>
            )}
          </div>
          <div className="absolute right-3 bottom-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-300" />{" "}
            <span>
              {rating}
              {count ? (
                <span className="ml-1 text-xs opacity-80">({count})</span>
              ) : null}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-6 md:w-2/3 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold leading-snug">
              {nombre}
            </h3>
            <div className="mt-1 text-sm text-gray-500">{ciudad}</div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
              {t.bioCorta || t.descripcion || "Sin descripción disponible."}
            </p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {especArr.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"
                >
                  <TagIcon className="w-3 h-3 text-gray-500" /> {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 md:mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              <div className="text-xs text-gray-500">Precio</div>
              <div className="text-base font-semibold">
                {tarifa !== null
                  ? money(tarifa, t?.moneda || "USD")
                  : "A convenir"}
              </div>
            </div>

            {/* Botones: apilados en móvil, inline en desktop; full width en móvil para visibilidad */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to={perfilPath}
                className="w-full sm:flex-1 text-center px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
                aria-label={`Ver perfil de ${nombre}`}
              >
                Ver perfil
              </Link>

              <button
                type="button"
                onClick={goReservar}
                disabled={!tid}
                className="w-full sm:flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-400 text-white font-semibold hover:from-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Reservar con ${nombre}`}
                title={tid ? "Reservar" : "Falta id del técnico"}
              >
                Reservar
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
