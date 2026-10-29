// src/Pages/Home/Home.jsx
// Página de inicio pública.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Star, CalendarCheck, Wallet } from "lucide-react";
import TechnicianCard from "../../Components/Common/Catalog/TechnicianCard";
import { Avatar, Badge, Button, Rating } from "../../ui";
import { specialtyVisual } from "../../ui/specialty";
import { fetchPublicTechniciansPreview, fetchPublicReviewsStrip } from "../../services/publicData";
import { ESPECIALIDADES_DESTACADAS, ESPECIALIDADES } from "../../utils/catalog";
import { cx } from "../../ui/cx";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [esp, setEsp] = useState("");

  const [techs, setTechs] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [errorTechs, setErrorTechs] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchPublicTechniciansPreview()
      .then((data) => mounted && setTechs(data))
      .catch((err) => {
        console.error(err);
        if (mounted) setErrorTechs("No pudimos cargar los técnicos por ahora.");
      })
      .finally(() => mounted && setLoadingTechs(false));

    fetchPublicReviewsStrip({ take: 3 })
      .then((r) => mounted && setReviews(r))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (esp) params.set("esp", esp);
    navigate(`/tecnicos${params.toString() ? `?${params}` : ""}`);
  };

  const destacado = techs[0];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-10 px-4 pb-10 pt-12 sm:px-6 md:pt-16">
        <div className="min-w-0 flex-[1_1_460px]">
          <Badge tone="brand" className="px-3 py-1.5 text-[13px]">Técnicos verificados en Barranquilla</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
            Arreglos en casa con técnicos de confianza
          </h1>
          <p className="mt-4 max-w-[520px] text-[17px] leading-relaxed text-muted">
            Mira precios y reseñas, elige una hora en la agenda del técnico y paga cuando el trabajo esté hecho.
          </p>

          <form
            role="search"
            onSubmit={onSearch}
            className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_8px_24px_rgba(22,21,28,0.06)]"
          >
            <label className="flex min-w-[200px] flex-[2_1_200px] flex-col px-2.5 py-1.5 text-[11px] text-subtle">
              ¿Qué necesitas?
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: fuga en el lavaplatos"
                className="bg-transparent pt-0.5 text-[15px] text-ink outline-none placeholder:text-subtle"
              />
            </label>
            <label className="flex min-w-[150px] flex-[1_1_150px] flex-col border-line px-2.5 py-1.5 text-[11px] text-subtle sm:border-l">
              Especialidad
              <select
                value={esp}
                onChange={(e) => setEsp(e.target.value)}
                className="bg-transparent pt-0.5 text-[15px] text-ink outline-none"
              >
                <option value="">Todas</option>
                {ESPECIALIDADES.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg" className="min-h-[52px] flex-none">
              <Search className="h-4 w-4" aria-hidden="true" /> Buscar técnico
            </Button>
          </form>
        </div>

        {/* Visual */}
        <div className="relative hidden min-h-[400px] flex-[1_1_420px] md:block" aria-hidden="true">
          <div className={cx("absolute left-0 top-0 flex h-[300px] w-[62%] items-center justify-center rounded-[20px]", specialtyVisual("Plomería").cls)}>
            <HeroIcon name="Plomería" size={72} />
          </div>
          <div className={cx("absolute right-0 top-[60px] flex h-[220px] w-[42%] items-center justify-center rounded-[20px]", specialtyVisual("Electricidad").cls)}>
            <HeroIcon name="Electricidad" size={60} />
          </div>
          {destacado && (
            <div className="absolute bottom-0 left-[18%] flex w-[290px] items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[0_12px_32px_rgba(22,21,28,0.10)]">
              <Avatar name={destacado.nombre} src={destacado.fotoURL} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{destacado.nombre}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  {(destacado.especialidades || [])[0] || "Técnico"} · <Rating value={destacado.ratingPromedio} />
                </p>
              </div>
              <Badge tone="success">Disponible</Badge>
            </div>
          )}
        </div>
      </section>

      {/* Especialidades */}
      <section aria-labelledby="h-esp" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <h2 id="h-esp" className="text-2xl font-semibold">¿Qué necesitas arreglar?</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ESPECIALIDADES_DESTACADAS.map((e) => {
            const v = specialtyVisual(e);
            const Icon = v.icon;
            return (
              <Link
                key={e}
                to={`/tecnicos?esp=${encodeURIComponent(e)}`}
                className="flex items-center gap-3 rounded-[14px] border border-line p-4 transition-colors hover:border-brand hover:bg-brand-tint"
              >
                <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]", v.cls)}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="text-[15px] font-semibold">{e}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Destacados */}
      <section aria-labelledby="h-dest" className="mx-auto max-w-[1200px] px-4 pb-12 pt-6 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="h-dest" className="text-2xl font-semibold">Mejor calificados</h2>
          <Link to="/tecnicos" className="flex items-center gap-1 text-sm font-medium text-brand-ink hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {errorTechs ? (
          <p className="mt-5 text-sm text-bad">{errorTechs}</p>
        ) : loadingTechs ? (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[290px] animate-pulse rounded-[14px] bg-canvas" />
            ))}
          </div>
        ) : techs.length === 0 ? (
          <p className="mt-5 text-sm text-muted">Pronto verás aquí a los técnicos publicados.</p>
        ) : (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {techs.slice(0, 4).map((t) => (
              <TechnicianCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" aria-labelledby="h-como" className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <h2 id="h-como" className="text-2xl font-semibold">Cómo funciona</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, t: "Compara técnicos", d: "Precios, zonas y reseñas de otros clientes antes de decidir." },
              { icon: CalendarCheck, t: "Reserva una hora", d: "Eliges en su agenda real y le escribes por chat si tienes dudas." },
              { icon: Wallet, t: "Paga y califica", d: "Registras el pago cuando el trabajo queda listo y dejas tu reseña." },
            ].map((s, i) => (
              <li key={s.t} className="rounded-[14px] border border-line bg-white p-5">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-brand-ink">
                  <s.icon className="h-4 w-4" aria-hidden="true" /> Paso {i + 1}
                </span>
                <p className="mt-2 text-[17px] font-semibold">{s.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reseñas destacadas (solo si hay aprobadas) */}
      {reviews.length > 0 && (
        <section aria-labelledby="h-res" className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-6">
          <h2 id="h-res" className="text-2xl font-semibold">Lo que dicen los clientes</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-[14px] border border-line bg-white p-5">
                <div className="flex gap-0.5" aria-label={`${r.rating || 5} de 5 estrellas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cx("h-4 w-4", i < (r.rating || 5) ? "fill-star text-star" : "text-line")} aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink">{r.comentario || r.comment}</blockquote>
                <figcaption className="mt-3 text-xs text-muted">{r.clienteNombre || r.clientName || "Cliente"}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Para técnicos */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink p-8 text-white sm:p-9">
          <div className="max-w-[560px]">
            <h2 className="text-[28px] font-semibold">¿Eres técnico? Consigue clientes en tu zona</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#D4D4D8]">
              Crea tu perfil gratis, define tus precios y horarios, y recibe reservas directamente en tu agenda.
            </p>
          </div>
          <Link to="/auth/register?rol=tecnico" className="rounded-xl bg-white px-5 py-3.5 text-[15px] font-semibold text-ink hover:bg-brand-soft">
            Publicar mi perfil
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroIcon({ name, size }) {
  const Icon = specialtyVisual(name).icon;
  return <Icon style={{ width: size, height: size }} strokeWidth={1.2} />;
}
