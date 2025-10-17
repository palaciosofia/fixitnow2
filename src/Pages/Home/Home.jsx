// src/Pages/Home/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

// Secciones comunes (capa base)
import Hero from "../../Components/Common/Hero";
import HowItWorks from "../../Components/Common/HowItWorks";
import Benefits from "../../Components/Common/Benefits";
import ReviewsStrip from "../../Components/Common/ReviewsStrip";
import CatalogGrid from "../../Components/Common/Catalog/CatalogGrid";
import SectionTitle from "../../Components/SectionTitle/SectionTitle";

// Iconos
import { ArrowRight, Search, Star, Users, Zap, Shield } from "lucide-react";

// Lecturas centralizadas
import {
  fetchPublicTechniciansPreview, // 👈 nuevo helper (6 por defecto)
  fetchPublicReviewsStrip,
} from "../../services/publicData";

export default function Home() {
  const [searchParams] = useSearchParams();

  // Query pública: ?q= (búsqueda libre) y ?esp= (especialidad)
  const q = (searchParams.get("q") || "").trim();
  const esp = (searchParams.get("esp") || "").trim();

  // Estado catálogo
  const [techs, setTechs] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [errorTechs, setErrorTechs] = useState("");

  // Estado reseñas
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Filtros server-side (especialidad) + client-side (q)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingTechs(true);
      setErrorTechs("");
      try {
        // Solo 6 para el preview de Home
        const data = await fetchPublicTechniciansPreview({
          especialidad: esp || undefined,
        });
        if (!mounted) return;

        // Si hay q, filtramos client-side por nombre, ciudad y especialidades
        const filtered = q
          ? data.filter((t) => {
              const norm = (s) => (s || "").toString().toLowerCase();
              const qq = norm(q);
              const nombre = norm(t.nombre);
              const ciudad = norm(t.ciudad);
              const especs = (t.especialidades || []).map(norm).join(" ");
              return (
                nombre.includes(qq) ||
                ciudad.includes(qq) ||
                especs.includes(qq)
              );
            })
          : data;

        setTechs(filtered);
      } catch (err) {
        console.error(err);
        setErrorTechs("No pudimos cargar el catálogo por ahora.");
      } finally {
        if (mounted) setLoadingTechs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [q, esp]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingReviews(true);
      try {
        const r = await fetchPublicReviewsStrip({ take: 6 });
        if (mounted) setReviews(r);
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Texto del subtítulo del catálogo (ayuda al usuario)
  const catalogSubtitle = useMemo(() => {
    if (esp && q) return `Filtrado por especialidad: “${esp}” y búsqueda: “${q}”`;
    if (esp) return `Filtrado por especialidad: “${esp}”`;
    if (q) return `Resultados para: “${q}”`;
    return "Explora técnicos disponibles por ciudad y especialidad";
  }, [esp, q]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* HERO / Promesa y CTA */}
      <Hero />

      {/* CATÁLOGO PREMIUM (ancla para navbar/hero) */}
      <section id="catalogo" className="relative py-20 overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header espectacular con SectionTitle */}
          <div className="mb-16">
            <SectionTitle 
              title="Técnicos Disponibles" 
              subtitle={catalogSubtitle}
              variant="elegant"
              icon="star"
              textAlign="center"
              mb="mb-0"
            />
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Técnicos Expertos</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">Calificación</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Disponibilidad</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">100%</div>
                  <div className="text-sm text-gray-600">Garantía</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del catálogo */}
          {errorTechs ? (
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 p-8 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-800">Error al cargar técnicos</h3>
                  <p className="text-red-600">{errorTechs}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Grid mejorado con container */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl mb-12">
                <CatalogGrid data={techs} loading={loadingTechs} />
              </div>

              {/* Botón Ver más espectacular */}
              <div className="flex justify-center">
                <Link 
                  to="/catalogo" 
                  className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Search className="w-6 h-6" />
                    Explorar Todos los Técnicos
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA con mejor spacing */}
      <section className="py-20">
        <HowItWorks />
      </section>

      {/* BENEFICIOS con mejor spacing */}
      <section className="py-20">
        <Benefits />
      </section>

      {/* RESEÑAS con mejor spacing */}
      <section className="py-20">
        <ReviewsStrip data={reviews} loading={loadingReviews} />
      </section>
    </div>
  );
}
