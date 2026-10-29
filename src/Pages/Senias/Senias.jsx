// src/Pages/Senias/Senias.jsx
// Reseñas: técnicos publicados con su calificación y sus comentarios más recientes.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { MessageSquareText, Search, Star } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { getAllTechs } from "../../services/technicians";
import { getTechnicianReviews } from "../../services/reviews";
import ReviewModal from "../../Components/ReviewModal";
import { Avatar, Button, Card, EmptyState, Loader, PageHeader, Rating, Select } from "../../ui";
import { techPath } from "../../utils/catalog";

const PAGE = 10;

export default function Senias() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [techs, setTechs] = useState([]);
  const [reviewsByTech, setReviewsByTech] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [reviewTech, setReviewTech] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getAllTechs();
        if (!alive) return;
        setTechs(list);
        const entries = await Promise.all(list.map(async (t) => [t.id, await getTechnicianReviews(t.id)]));
        if (alive) setReviewsByTech(Object.fromEntries(entries));
      } catch (e) {
        console.error("Error cargando reseñas:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cities = useMemo(() => [...new Set(techs.map((t) => t.ciudad).filter(Boolean))].sort(), [techs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return techs.filter((t) => {
      if (city && t.ciudad !== city) return false;
      if (!term) return true;
      return (
        String(t.nombre || "").toLowerCase().includes(term) ||
        (t.especialidades || []).some((e) => e.toLowerCase().includes(term))
      );
    });
  }, [techs, q, city]);

  useEffect(() => setShown(PAGE), [q, city]);

  const openReview = (tech) => {
    if (!user) {
      nav("/auth/login", { state: { from: location } });
      return;
    }
    setReviewTech({ id: tech.id, nombre: tech.nombre });
  };

  if (loading) return <Loader label="Cargando reseñas…" />;

  return (
    <div>
      <PageHeader title="Reseñas" subtitle="Lo que dicen los clientes de cada técnico" />

      <div className="mb-4 flex flex-wrap gap-2.5 rounded-[14px] border border-line bg-white p-3">
        <label className="flex h-10 min-w-[220px] flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-line px-3 text-subtle focus-within:border-brand">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Buscar técnico o especialidad</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Técnico o especialidad" className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle" />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Ciudad
          <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 w-auto">
            <option value="">Todas</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="Sin resultados" text="Prueba con otro nombre o ciudad." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.slice(0, shown).map((t) => {
            const reviews = [...(reviewsByTech[t.id] || [])].sort(
              (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
            );
            const last = reviews[0];
            return (
              <Card as="li" key={t.id} className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
                <Avatar name={t.nombre} src={t.fotoURL} size={48} />
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link to={techPath(t)} className="text-[15px] font-semibold hover:text-brand-ink">{t.nombre}</Link>
                    <Rating value={t.ratingPromedio} count={reviews.length} />
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{[(t.especialidades || []).slice(0, 2).join(" · "), t.ciudad].filter(Boolean).join(" · ")}</p>
                  {last ? (
                    <blockquote className="mt-3 rounded-xl bg-canvas px-3.5 py-3 text-sm leading-relaxed text-[#3F3F46]">
                      <span className="mb-1 flex items-center gap-1 text-xs text-star" aria-label={`${last.rating} de 5 estrellas`}>
                        {Array.from({ length: Math.round(last.rating || 0) }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-star" aria-hidden="true" />)}
                      </span>
                      “{last.comment}”
                      <footer className="mt-1.5 text-xs text-subtle">
                        {last.clientName || "Cliente"}{last.createdAt?.toDate ? ` · ${dayjs(last.createdAt.toDate()).fromNow()}` : ""}
                      </footer>
                    </blockquote>
                  ) : (
                    <p className="mt-3 text-sm text-subtle">Todavía no tiene reseñas.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" to={techPath(t)}>Ver perfil</Button>
                  {user?.uid !== t.uid && (
                    <Button size="sm" variant="soft" onClick={() => openReview(t)}>
                      <Star className="h-4 w-4" aria-hidden="true" /> Calificar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {shown < filtered.length && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Ver más técnicos</Button>
        </div>
      )}

      <ReviewModal
        isOpen={!!reviewTech}
        onClose={() => setReviewTech(null)}
        technician={reviewTech}
        userId={user?.uid}
        userName={profile?.name || user?.displayName}
        onSuccess={() => {
          if (reviewTech) getTechnicianReviews(reviewTech.id).then((r) => setReviewsByTech((m) => ({ ...m, [reviewTech.id]: r })));
        }}
      />
    </div>
  );
}
