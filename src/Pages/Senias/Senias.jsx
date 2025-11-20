// src/Pages/Senias/Senias.jsx - Página de Reseñas
import React, { useEffect, useState } from "react";
import {
  Star,
  Search,
  MapPin,
  Award,
  MessageSquare,
  Zap,
  Smile,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import SectionTitle from "../../Components/SectionTitle/SectionTitle";
import ReviewModal from "../../Components/ReviewModal";
import { getAllTechs } from "../../services/technicians";
import { getTechnicianReviews } from "../../services/reviews";
import { useAuth } from "../../context/AuthProvider";

const Senias = () => {
  // ✅ Tomar usuario del AuthProvider
  const { user, isCliente } = useAuth();

  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [technicianReviews, setTechnicianReviews] = useState({});
  
  // Paginación
  const ITEMS_PER_PAGE = 10;
  const [displayedTechnicians, setDisplayedTechnicians] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [selectedTech, setSelectedTech] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Cargar técnicos + reseñas
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const techs = await getAllTechs();
        setTechnicians(techs);
        setFilteredTechnicians(techs);

        const reviewsMap = {};
        for (const tech of techs) {
          const reviews = await getTechnicianReviews(tech.id);
          reviewsMap[tech.id] = reviews;
        }
        setTechnicianReviews(reviewsMap);
      } catch (error) {
        console.error("Error loading technicians:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTechnicians();
  }, []);

  // Filtrar técnicos
  useEffect(() => {
    let filtered = technicians;

    if (searchTerm) {
      filtered = filtered.filter(
        (tech) =>
          tech.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.especialidades?.some((e) =>
            e.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((tech) => tech.ciudad === selectedCity);
    }

    setFilteredTechnicians(filtered);
  }, [searchTerm, selectedCity, technicians]);

  // Actualizar técnicos mostrados cuando filtrados o página cambian
  useEffect(() => {
    setCurrentPage(1); // Reset a página 1 cuando se filtra
    const start = 0;
    const end = ITEMS_PER_PAGE;
    setDisplayedTechnicians(filteredTechnicians.slice(start, end));
  }, [filteredTechnicians]);

  // Cargar más técnicos
  const handleLoadMore = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    const start = 0;
    const end = ITEMS_PER_PAGE * newPage;
    setDisplayedTechnicians(filteredTechnicians.slice(start, end));
  };

  const hasMore = displayedTechnicians.length < filteredTechnicians.length;

  const cities = [
    ...new Set(technicians.map((t) => t.ciudad).filter(Boolean)),
  ];

  const openReviewModal = (tech) => {
    // ✅ Usar el user del contexto
    if (!user) {
      alert("Debes iniciar sesión para dejar una reseña");
      return;
    }

    // (Opcional) si SOLO clientes pueden reseñar:
    // if (!isCliente) {
    //   alert("Solo los clientes pueden dejar reseñas");
    //   return;
    // }

    setSelectedTech(tech);
    setShowReviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center py-24 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/40 via-emerald-300/30 to-transparent rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tl from-teal-400/40 via-cyan-300/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-emerald-300/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 backdrop-blur-md rounded-full border-2 border-emerald-200/50 shadow-xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                </motion.div>
                <span className="text-sm font-black text-emerald-700" style={{ fontFamily: "Space Grotesk" }}>
                  Opiniones Verificadas de Clientes Reales
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1
                className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-lg"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Reseñas de
                <br />
                Técnicos
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p className="text-lg md:text-xl text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
                Descubre los mejores técnicos según las experiencias reales de clientes. 
                <span className="text-emerald-700 font-black"> Busca, evalúa y comparte tu reseña.</span>
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.scrollTo({ top: document.querySelector('.grid')?.offsetTop, behavior: 'smooth' })}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
                style={{ fontFamily: 'Outfit' }}
              >
                <Search className="w-5 h-5" />
                Explorar Técnicos
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.scrollTo({ top: 0 })}
                className="px-8 py-4 bg-white text-emerald-600 font-black rounded-2xl shadow-lg hover:shadow-xl border-2 border-emerald-200 transition-all inline-flex items-center gap-3"
                style={{ fontFamily: 'Outfit' }}
              >
                <MessageSquare className="w-5 h-5" />
                Dejar Reseña
              </motion.button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              ref={statsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto"
            >
              {[
                { number: filteredTechnicians.length, label: "Técnicos" },
                { number: Object.values(technicianReviews).flat().length, label: "Reseñas" },
                { number: "4.8", label: "Rating Promedio" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={statsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
                  className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border-2 border-emerald-100/50 shadow-lg"
                >
                  <div className="text-3xl md:text-4xl font-black text-emerald-600" style={{ fontFamily: "Space Grotesk" }}>
                    {stat.number}
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Búsqueda y Filtros */}
      <section className="py-16 px-4 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Búsqueda */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type="text"
                placeholder="Buscar técnico o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white/80 backdrop-blur-sm font-medium text-gray-900 placeholder-gray-500 transition-all"
              />
            </motion.div>

            {/* Filtro por ciudad */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-4 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white/80 backdrop-blur-sm font-medium text-gray-900 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2316a34a' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Contador de resultados */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center md:justify-end"
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl px-6 py-4">
                <p className="text-sm text-gray-600">Técnicos encontrados</p>
                <p className="text-3xl font-black text-emerald-600" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {filteredTechnicians.length}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Grid de Técnicos */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Cargando técnicos...</p>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No se encontraron técnicos</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedTechnicians.map((tech, i) => {
                const reviews = technicianReviews[tech.id] || [];
                const rating = tech.ratingPromedio || 0;

                return (
                  <motion.div
                    key={tech.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-3xl overflow-hidden border-2 border-emerald-100 shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 group"
                  >
                    {/* Imagen */}
                    <div className="relative h-56 bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-300 overflow-hidden">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10" />
                        { (tech.fotoURL || tech.foto) ? (
                            <img
                            src={tech.fotoURL || tech.foto}
                            alt={tech.nombre}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-200 to-teal-200">
                            <Award className="w-20 h-20 text-emerald-500" />
                            </div>
                        )}
                        {rating >= 4.5 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-lg"
                              style={{ fontFamily: 'Space Grotesk' }}
                            >
                            <Star className="w-4 h-4 fill-current" /> Destacado
                            </motion.div>
                        )}
                    </div>

                    {/* Contenido */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                          {tech.nombre}
                        </h3>
                        {tech.especialidades && tech.especialidades.length > 0 && (
                          <p className="text-sm text-emerald-600 font-bold">
                            {tech.especialidades.join(", ")}
                          </p>
                        )}
                      </div>

                      {tech.ciudad && (
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          {tech.ciudad}
                        </div>
                      )}

                      {/* Rating */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, j) => (
                              <Star
                                key={j}
                                className={`w-4 h-4 ${
                                  j < Math.round(rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-black text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">
                          {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
                        </span>
                      </div>

                      {/* Últimas reseñas */}
                      {reviews.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-40 overflow-y-auto space-y-3">
                          {reviews.slice(0, 2).map((review) => (
                            <motion.div
                              key={review.id}
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              className="text-xs border-l-2 border-emerald-400 pl-3"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900">
                                  {review.clientName}
                                </span>
                                <div className="flex gap-0.5">
                                  {[...Array(review.rating)].map((_, j) => (
                                    <Star
                                      key={j}
                                      className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-600 line-clamp-2 text-xs">
                                "{review.comment}"
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Botón */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openReviewModal(tech)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:shadow-lg transition-all relative overflow-hidden group/btn"
                        style={{ fontFamily: 'Outfit' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <MessageSquare className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Dejar Reseña</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Botón Cargar más */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-16"
              >
                <motion.button
                  whileHover={{ scale: 1.08, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoadMore}
                  className="relative px-12 py-5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white rounded-3xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span>Cargar más técnicos</span>
                    <motion.span
                      animate={{ y: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ↓
                    </motion.span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                </motion.button>
              </motion.div>
            )}
            </>
          )}
        </div>
      </section>

      {/* Estadísticas */}
      <section
        ref={statsRef}
        className="py-20 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: technicians.length, label: "Técnicos Verificados" },
              {
                number: Object.values(technicianReviews).flat().length,
                label: "Reseñas Totales",
              },
              { number: "4.6★", label: "Calificación Promedio" },
              { number: "95%", label: "Clientes Satisfechos" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.1 }}
                className="text-center text-white"
              >
                <div
                  className="text-4xl md:text-5xl font-black mb-2"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {stat.number}
                </div>
                <p className="text-lg font-semibold opacity-90">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              ¿Por qué dejar una reseña?
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6">
            {[
              {
                number: "01",
                title: "Ayuda a otros clientes",
                description: "Tus opiniones ayudan a otros clientes a encontrar el técnico perfecto para su necesidad",
              },
              {
                number: "02",
                title: "Mejora el servicio",
                description: "Los técnicos se esfuerzan más sabiendo que sus clientes comparten su experiencia",
              },
              {
                number: "03",
                title: "Obtén beneficios exclusivos",
                description: "Los clientes que dejan reseñas acceden a descuentos y promociones especiales",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="group relative bg-gradient-to-r from-white to-emerald-50/30 rounded-3xl p-8 border-2 border-gray-100 hover:border-emerald-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Decorative number background */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="text-9xl font-black text-emerald-600">{item.number}</span>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    {/* Number badge */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl font-black text-white">{item.number}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3
                        className="text-xl font-black text-gray-900 mb-2"
                        style={{ fontFamily: "Space Grotesk, sans-serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-black mb-6 text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              ¿Tuviste una experiencia memorable?
            </h2>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Comparte tu experiencia y ayuda a otros clientes a encontrar los mejores técnicos de la plataforma
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-10 py-4 bg-white text-emerald-600 font-black rounded-2xl shadow-xl hover:bg-gray-50 transition-all inline-flex items-center gap-3"
              style={{ fontFamily: 'Outfit' }}
            >
              <Star className="w-5 h-5" />
              Dejar mi primera reseña
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Modal de reseña */}
      {selectedTech && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            const techId = selectedTech.id;
            setSelectedTech(null);
            getTechnicianReviews(techId).then((reviews) => {
              setTechnicianReviews((prev) => ({
                ...prev,
                [techId]: reviews,
              }));
            });
          }}
          technician={selectedTech}
          userId={user?.uid}
          userName={user?.displayName || user?.email || "Cliente"}
        />
      )}
    </div>
  );
};

export default Senias;
