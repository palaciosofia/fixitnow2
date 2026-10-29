// src/Components/Common/Catalog/TechnicianCard.jsx
// Tarjeta de técnico del catálogo: foto (o imagen de su especialidad), precio,
// calificación, servicio principal, nombre y zona.
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Avatar, Badge, Rating, SpecialtyCover, Verified } from "../../../ui";
import { formatCOP } from "../../../utils/money";
import { priceFrom, techHeadline, techPath, isTopRated } from "../../../utils/catalog";

export default function TechnicianCard({ t }) {
  const nombre = t?.nombre || "Técnico";
  const especialidad = (t?.especialidades || [])[0] || "";
  const precio = priceFrom(t);
  const zona = (t?.zonasCobertura || [])[0] || t?.ciudad || "";
  const foto = t?.fotoURL || t?.fotoUrl || "";

  return (
    <article className="group relative flex flex-col gap-2 rounded-[14px] border border-line bg-white p-2.5 transition-shadow hover:shadow-[0_8px_24px_rgba(22,21,28,0.08)]">
      <SpecialtyCover specialty={especialidad} src={foto} className="h-[150px]">
        {isTopRated(t) && (
          <Badge tone="solid" className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px]">Top</Badge>
        )}
      </SpecialtyCover>

      <div className="flex items-baseline justify-between px-1">
        <p>
          {precio > 0 ? (
            <>
              <span className="text-[17px] font-bold text-brand-ink">{formatCOP(precio)}</span>
              <span className="text-xs text-subtle"> /visita</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-muted">Precio a convenir</span>
          )}
        </p>
        <Rating value={t?.ratingPromedio} count={t?.["reseñasCount"]} />
      </div>

      <h3 className="px-1 text-[15px] font-semibold leading-snug">
        {/* El enlace cubre toda la tarjeta */}
        <Link to={techPath(t)} className="after:absolute after:inset-0 after:rounded-[14px] focus-visible:outline-none">
          {techHeadline(t)}
        </Link>
      </h3>

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted">
        <Avatar name={nombre} src={foto} size={20} />
        Por {nombre}
        {t?.publicado && <Verified className="h-3.5 w-3.5" />}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#F0F0F3] px-1 pb-0.5 pt-2 text-xs text-muted">
        <span className="flex min-w-0 items-center gap-1">
          {zona && <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{zona}</span>
        </span>
        {t?.disponible === false ? (
          <span className="shrink-0">Agenda llena</span>
        ) : (
          <span className="shrink-0 font-medium text-ok">● Disponible</span>
        )}
      </div>
    </article>
  );
}
