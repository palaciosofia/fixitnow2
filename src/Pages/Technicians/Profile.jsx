// src/Pages/Technicians/Profile.jsx
// Perfil público del técnico (por slug o id) con el cuadro de reserva al lado.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { MessageCircle, Phone, Award, MapPin, Clock, UserX, CalendarCheck } from "lucide-react";
import dayjs from "dayjs";
import { db } from "../../firebase";
import { getTechBySlug } from "../../services/technicians";
import { getTechnicianReviews } from "../../services/reviews";
import { useAuth } from "../../context/AuthProvider";
import BookingPanel from "../../Components/BookingPanel";
import { Avatar, Badge, Button, Card, CardTitle, EmptyState, Rating, SpecialtyCover, Verified } from "../../ui";
import { formatCOP } from "../../utils/money";
import { priceFrom } from "../../utils/catalog";
import { cx } from "../../ui/cx";

const DIAS = [
  ["lun", "Lunes"], ["mar", "Martes"], ["mie", "Miércoles"], ["jue", "Jueves"],
  ["vie", "Viernes"], ["sab", "Sábado"], ["dom", "Domingo"],
];

export default function Profile() {
  const { slug } = useParams(); // puede ser slug o id
  const { user } = useAuth();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!slug) {
      setTech(null);
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      let t = null;
      // 1) Por slug (solo publicados)
      try {
        t = await getTechBySlug(slug);
      } catch {
        /* sigue con los otros intentos */
      }
      // 2) Como ID del documento
      if (!t) {
        try {
          const snap = await getDoc(doc(db, "technicians", slug));
          if (snap.exists()) t = { id: snap.id, ...snap.data() };
        } catch {
          /* sin permiso o no existe */
        }
      }
      // 3) Por campo slug sin filtrar publicado (el dueño viendo su perfil)
      if (!t) {
        try {
          const qs = await getDocs(query(collection(db, "technicians"), where("slug", "==", slug), limit(1)));
          if (!qs.empty) t = { id: qs.docs[0].id, ...qs.docs[0].data() };
        } catch {
          /* sin permiso */
        }
      }
      if (!alive) return;
      setTech(t);
      setLoading(false);
      if (t) {
        getTechnicianReviews(t.id || t.uid).then((r) => alive && setReviews(r)).catch(() => {});
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    [reviews]
  );
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const n = Math.round(Number(r.rating) || 0);
      if (d[n] != null) d[n] += 1;
    });
    return d;
  }, [reviews]);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]" aria-hidden="true">
        <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
        <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!tech) {
    return (
      <EmptyState
        icon={UserX}
        title="Perfil no disponible"
        text="Este técnico no existe o todavía no publicó su perfil."
        action={<Button to="/tecnicos">Volver al catálogo</Button>}
      />
    );
  }

  const nombre = tech.nombre || "Técnico";
  const foto = tech.fotoURL || tech.fotoUrl || "";
  const especialidades = tech.especialidades || [];
  const servicios = (tech.servicios || []).filter((s) => s?.nombre);
  const zonas = tech.zonasCobertura || [];
  const certificaciones = tech.certificaciones || [];
  const anios = Number(tech.aniosExperiencia ?? tech.añosExperiencia) || 0;
  const precio = priceFrom(tech);
  const tid = tech.id || tech.uid;
  const whatsapp = (tech.telefono || "").replace(/\D/g, "");
  const esPropio = user && tech.uid === user.uid;
  const ratingCount = tech["reseñasCount"] ?? reviews.length;
  const horarios = tech.horarios && typeof tech.horarios === "object" ? tech.horarios : null;

  return (
    <div>
      <nav aria-label="Ruta" className="mb-4 flex flex-wrap gap-1.5 text-[13px] text-subtle">
        <Link to="/tecnicos" className="hover:text-ink">Técnicos</Link>
        {especialidades[0] && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/tecnicos?esp=${encodeURIComponent(especialidades[0])}`} className="hover:text-ink">{especialidades[0]}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-ink">{nombre}</span>
      </nav>

      {esPropio && !tech.publicado && (
        <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          Así se verá tu perfil. Todavía no está publicado: <Link to="/mi-perfil" className="font-semibold underline">complétalo aquí</Link>.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-5">
        {/* Columna principal */}
        <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-4">
          <Card className="overflow-hidden">
            <SpecialtyCover specialty={especialidades[0]} className="h-[140px] rounded-none" iconSize={64} />
            <div className="px-5 pb-5 sm:px-6">
              <div className="relative -mt-11">
                <Avatar name={nombre} src={foto} size={88} className="border-4 border-white" />
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <div className="min-w-[200px] flex-1">
                  <h1 className="flex items-center gap-2 text-2xl font-semibold">
                    {nombre} {tech.publicado && <Verified className="h-[18px] w-[18px]" />}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    {[especialidades.slice(0, 2).join(" · "), anios ? `${anios} años de experiencia` : null, tech.ciudad].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!esPropio && (
                    <Button href="#reservar" className="lg:hidden">
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Reservar
                    </Button>
                  )}
                  {user && !esPropio && (
                    <Button variant="secondary" to={`/chat/${tech.uid || tid}/${encodeURIComponent(nombre)}`}>
                      <MessageCircle className="h-4 w-4" aria-hidden="true" /> Escribir
                    </Button>
                  )}
                  {whatsapp && (
                    <Button variant="secondary" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                      <Phone className="h-4 w-4" aria-hidden="true" /> WhatsApp
                    </Button>
                  )}
                </div>
              </div>

              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-muted">
                <div>
                  <dt className="sr-only">Calificación</dt>
                  <dd className="text-lg font-semibold text-ink"><Rating value={tech.ratingPromedio} className="text-lg" /></dd>
                  <dd>{ratingCount} {ratingCount === 1 ? "reseña" : "reseñas"}</dd>
                </div>
                <div>
                  <dt className="sr-only">Precio</dt>
                  <dd className="text-lg font-semibold text-ink">{precio ? formatCOP(precio) : "A convenir"}</dd>
                  <dd>precio desde</dd>
                </div>
                <div>
                  <dt className="sr-only">Disponibilidad</dt>
                  <dd className={cx("text-lg font-semibold", tech.disponible === false ? "text-muted" : "text-ok")}>
                    {tech.disponible === false ? "Agenda llena" : "Disponible"}
                  </dd>
                  <dd>para nuevos trabajos</dd>
                </div>
              </dl>

              {(tech.bioCorta || tech.descripcion) && (
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[#3F3F46]">{tech.bioCorta || tech.descripcion}</p>
              )}
            </div>
          </Card>

          {(servicios.length > 0 || zonas.length > 0) && (
            <Card className="p-5 sm:p-6">
              <CardTitle>Servicios y precios</CardTitle>
              {servicios.length > 0 ? (
                <ul>
                  {servicios.map((s) => (
                    <li key={s.nombre} className="flex justify-between gap-4 border-t border-[#F0F0F3] py-3 text-sm">
                      <span>{s.nombre}</span>
                      <span className="font-semibold">{Number(s.precioSugerido) > 0 ? formatCOP(s.precioSugerido) : "A convenir"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">El técnico aún no publica sus precios. Pregúntale por chat.</p>
              )}
              {zonas.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium"><MapPin className="h-4 w-4" aria-hidden="true" /> Zonas donde trabaja</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zonas.map((z) => <Badge key={z}>{z}</Badge>)}
                  </div>
                </div>
              )}
            </Card>
          )}

          {(horarios || certificaciones.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {horarios && (
                <Card className="p-5">
                  <CardTitle><span className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden="true" /> Horario</span></CardTitle>
                  <ul className="text-sm">
                    {DIAS.map(([k, label]) => {
                      const f = (horarios[k] || [])[0];
                      return (
                        <li key={k} className="flex justify-between py-1.5">
                          <span className="text-muted">{label}</span>
                          <span className={f ? "font-medium" : "text-subtle"}>{f ? `${f.inicio} – ${f.fin}` : "No atiende"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}
              {certificaciones.length > 0 && (
                <Card className="p-5">
                  <CardTitle><span className="flex items-center gap-2"><Award className="h-4 w-4" aria-hidden="true" /> Certificaciones</span></CardTitle>
                  <ul className="flex flex-col gap-2 text-sm">
                    {certificaciones.map((c, i) => (
                      <li key={i} className="rounded-lg bg-canvas px-3 py-2">{typeof c === "string" ? c : c?.nombre || c?.titulo}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          <Card className="p-5 sm:p-6">
            <CardTitle>Reseñas</CardTitle>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">Todavía no tiene reseñas.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-7">
                  <div>
                    <p className="text-[40px] font-semibold leading-none tracking-tight">{Number(tech.ratingPromedio || 0).toFixed(1)}</p>
                    <p className="mt-1 text-[13px] text-muted">{reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}</p>
                  </div>
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-xs text-muted">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <div key={n} className="flex items-center gap-2.5">
                        <span className="w-3">{n}</span>
                        <span className="h-1.5 flex-1 rounded bg-[#F0F0F3]">
                          <span className="block h-1.5 rounded bg-brand" style={{ width: `${(dist[n] / reviews.length) * 100}%` }} />
                        </span>
                        <span className="w-5 text-right">{dist[n]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="mt-2">
                  {sortedReviews.slice(0, 6).map((r) => (
                    <li key={r.id} className="mt-4 border-t border-[#F0F0F3] pt-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.clientName} size={32} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{r.clientName || "Cliente"}</p>
                          {r.createdAt?.toDate && <p className="text-xs text-subtle">{dayjs(r.createdAt.toDate()).fromNow()}</p>}
                        </div>
                        <span className="text-[13px] text-star" aria-label={`${r.rating} de 5 estrellas`}>
                          {"★".repeat(Math.round(r.rating || 0))}
                          <span className="text-line">{"★".repeat(5 - Math.round(r.rating || 0))}</span>
                        </span>
                      </div>
                      {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-[#3F3F46]">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        {/* Reservar */}
        <div id="reservar" className="w-full min-w-0 scroll-mt-20 flex-[1_1_320px] lg:sticky lg:top-24 lg:max-w-[360px]">
          {esPropio ? (
            <Card className="p-5">
              <p className="text-sm text-muted">Este es tu perfil. Los clientes reservan desde aquí.</p>
              <Button to="/mi-perfil" className="mt-4 w-full">Editar mi perfil</Button>
            </Card>
          ) : (
            <BookingPanel tech={{ ...tech, id: tid }} />
          )}
        </div>
      </div>
    </div>
  );
}
