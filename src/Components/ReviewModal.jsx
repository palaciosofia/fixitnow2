// src/Components/ReviewModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send } from "lucide-react";
import { createReview } from "../services/reviews";

const ReviewModal = ({ isOpen, onClose, technician, userId, userName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      alert("Por favor escribe un comentario");
      return;
    }

    setLoading(true);
    try {
      await createReview(
        technician.id,
        userId,
        userName,
        rating,
        comment
      );
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setComment("");
        setRating(5);
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header con gradiente mejorado */}
              <div className="relative bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-600 p-8 pb-6 flex items-center justify-between overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -ml-8 -mb-8" />
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Tu Reseña
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">Comparte tu experiencia</p>
                </div>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="relative z-10 text-white/90 hover:text-white transition-colors bg-white/20 hover:bg-white/30 rounded-full p-2"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-8">
                {submitted ? (
                  // Success message
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6 }}
                    >
                      <Star className="w-10 h-10 text-white fill-white" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>¡Gracias!</h3>
                    <p className="text-gray-600 text-base">Tu reseña ha sido guardada exitosamente</p>
                  </motion.div>
                ) : (
                  // Form
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Technician info */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/50"
                    >
                      <div className="flex items-center gap-4">
                        {(technician.fotoURL || technician.foto) && (
                            <img
                                src={technician.fotoURL || technician.foto}
                                alt={technician.nombre}
                                className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white"
                            />
                        )}
                        <div>
                          <h3 className="font-black text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{technician.nombre}</h3>
                          <p className="text-sm text-emerald-700 font-semibold">{technician.especialidades?.[0] || "Técnico"}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Rating */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="block text-sm font-black text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                        ¿Cómo fue tu experiencia?
                      </label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            whileHover={{ scale: 1.15, rotate: 10 }}
                            whileTap={{ scale: 0.95 }}
                            className="transition-all"
                          >
                            <Star
                              className={`w-10 h-10 transition-all ${
                                star <= rating
                                  ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
                                  : "text-gray-200 hover:text-yellow-300"
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Comment */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-black text-gray-900 mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                        Tu comentario
                      </label>
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Cuéntanos tu experiencia con este técnico..."
                          maxLength={500}
                          className="w-full px-5 py-3 border-2 border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all bg-white/80 backdrop-blur-sm hover:border-emerald-300"
                          rows={4}
                        />
                        <div className="absolute bottom-3 right-4 text-xs font-semibold text-emerald-600 bg-white/80 px-2 py-1 rounded-full">
                          {comment.length}/500
                        </div>
                      </div>
                    </motion.div>

                    {/* Submit button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:shadow-2xl transition-all disabled:opacity-50 relative overflow-hidden group"
                      style={{ fontFamily: 'Outfit' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span className="relative z-10">Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Enviar Reseña</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
