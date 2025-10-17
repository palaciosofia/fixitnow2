// src/Components/ReserveModal.jsx
import { useEffect, useState } from "react";
import { X, Calendar, Clock, FileText, Sparkles, User, MapPin } from "lucide-react";

export default function ReserveModal({
  open = true,          
  tech,
  uid,
  onClose = () => {},
}) {
  if (!open) return null;
  if (!tech) return null;          // seguridad
  

  // evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      
      await new Promise((r) => setTimeout(r, 900));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Helper para obtener iniciales
  const getInitials = (name = "") => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl mx-4 transform transition-all duration-300 scale-100">
        {/* Header decorativo */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8">
          {/* Patrón de fondo decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute top-12 right-12 w-8 h-8 bg-white rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full"></div>
          </div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar del técnico */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 font-bold text-lg flex items-center justify-center">
                  {getInitials(tech?.nombre)}
                </div>
              </div>
              
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5" />
                  <h2 id="reserve-title" className="text-2xl font-bold">
                    Reservar Servicio
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{tech?.nombre || "Técnico"}</span>
                </div>
                {tech?.ciudad && (
                  <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{tech.ciudad}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200 text-white"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Fecha del servicio
                </label>
                <div className="relative">
                  <input 
                    value={date} 
                    onChange={(e)=>setDate(e.target.value)} 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 outline-none" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Hora preferida
                </label>
                <div className="relative">
                  <input 
                    value={time} 
                    onChange={(e)=>setTime(e.target.value)} 
                    type="time" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 outline-none" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-emerald-600" />
                Descripción del trabajo
              </label>
              <div className="relative">
                <textarea 
                  value={desc} 
                  onChange={(e)=>setDesc(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 outline-none resize-none" 
                  rows={4} 
                  placeholder="Describe brevemente el trabajo que necesitas. Ej: Reparar aire acondicionado que no enfría, revisar instalación eléctrica, etc."
                />
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-emerald-800 mb-1">¡Estás a un paso de reservar!</p>
                  <p className="text-emerald-700">El técnico se pondrá en contacto contigo para confirmar los detalles y coordinar el servicio.</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-semibold disabled:opacity-60 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>{submitting ? "Procesando reserva..." : "Confirmar reserva"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
