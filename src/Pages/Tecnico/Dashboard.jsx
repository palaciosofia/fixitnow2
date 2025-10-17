// src/Pages/Tecnico/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import {
  ensureMyTechnicianDoc,
  getMyTechnicianDoc,
  saveMyTechnicianDoc,
  setPublicado,
} from "../../services/technicians";
import { uploadToCloudinary } from "../../services/images";
import { clThumb } from "../../utils/cloudinary";
import { 
  Check, X, CloudUpload, Plus, Save, Eye, Camera, User, MapPin, 
  Phone, Calendar, Award, Wrench, DollarSign, Star, Globe, 
  Sparkles, Shield, Clock
} from "lucide-react";

// ------ Catálogos ------
const ESPECIALIDADES = [
  "Plomería", "Electricidad", "Carpintería", "Pintura", "Cerrajería",
  "Refrigeración", "Lavadoras / Secadoras", "Neveras", "Aires Acondicionados",
  "Gasodomésticos", "Drywall", "Pisos / Baldosas", "Impermeabilización",
  "Soldadura", "Aluminio / Vidriería", "Domótica básica", "CCTV",
  "Ensamble de muebles", "Jardinería menor", "Tapicería", "Yeso / Estuco",
  "Enchapes", "Iluminación LED", "Paneles solares (básico)"
];

const ZONAS_PREDEF = ["Zona 1", "Zona 2", "Zona 3", "Centro", "Norte", "Sur", "Este", "Oeste"];

// ------ Fallback avatar SVG ------
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
      <circle cx='50' cy='50' r='50' fill='#f3f4f6'/>
      <circle cx='50' cy='38' r='18' fill='#d1d5db'/>
      <path d='M10,90 a40,30 0 0,1 80,0' fill='#d1d5db'/>
    </svg>
  `);

// ------ Estado base ------
const EMPTY = {
  fotoURL: "",
  nombre: "",
  bioCorta: "",
  ciudad: "",
  especialidades: [],
  servicios: [], // [{ nombre, precioSugerido }]
  zonasCobertura: [],
  aniosExperiencia: 0,
  tarifaBase: null,
  disponible: true,
  horarios: "",

  // ✅ nuevos
  telefono: "",
  certificaciones: [],
  disponibilidadTxt: "",
};

// =======================================
//   Componente
// =======================================
export default function TecnicoDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [docTech, setDocTech] = useState(null);
  const [form, setForm] = useState(EMPTY);

  // ------- Carga inicial -------
  useEffect(() => {
    const boot = async () => {
      if (authLoading) return;
      if (!user || (role !== "tecnico" && role !== "admin")) {
        setMsg({ type: "error", text: "Debes iniciar sesión como técnico." });
        setLoading(false);
        return;
      }
      try {
        await ensureMyTechnicianDoc(user.uid, { nombre: user.displayName || "" });
        const data = await getMyTechnicianDoc(user.uid);
        setDocTech(data);
        setForm({
          ...EMPTY,
          ...data,
          servicios: Array.isArray(data?.servicios) ? data.servicios : [],
          especialidades: Array.isArray(data?.especialidades) ? data.especialidades : [],
          zonasCobertura: Array.isArray(data?.zonasCobertura) ? data.zonasCobertura : [],
          certificaciones: Array.isArray(data?.certificaciones) ? data.certificaciones : [],
        });
      } catch (e) {
        console.error(e);
        setMsg({ type: "error", text: "No se pudo cargar tu perfil técnico." });
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [user, role, authLoading]);

  // ------- Helpers de estado -------
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const addServicio = () =>
    setForm((s) => ({ ...s, servicios: [...s.servicios, { nombre: "", precioSugerido: "" }] }));

  const setServicio = (i, patch) =>
    setForm((s) => {
      const arr = [...s.servicios];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, servicios: arr };
    });

  const delServicio = (i) =>
    setForm((s) => ({ ...s, servicios: s.servicios.filter((_, idx) => idx !== i) }));

  const toggleEspecialidad = (esp) =>
    setForm((s) => {
      const has = s.especialidades.includes(esp);
      return {
        ...s,
        especialidades: has ? s.especialidades.filter((x) => x !== esp) : [...s.especialidades, esp],
      };
    });

  const toggleZona = (z) =>
    setForm((s) => {
      const has = s.zonasCobertura.includes(z);
      return {
        ...s,
        zonasCobertura: has ? s.zonasCobertura.filter((x) => x !== z) : [...s.zonasCobertura, z],
      };
    });

  
  const checklist = useMemo(() => {
    const fotoOK = !!form.fotoURL;
    const bioOK = typeof form.bioCorta === "string" && form.bioCorta.trim().length >= 120;
    const espOK = Array.isArray(form.especialidades) && form.especialidades.length >= 1;
    const servOK =
      Array.isArray(form.servicios) &&
      form.servicios.length >= 1 &&
      typeof form.servicios[0]?.nombre === "string" &&
      form.servicios[0].nombre.trim().length > 0 &&
      Number.isFinite(Number(form.servicios[0]?.precioSugerido)) &&
      Number(form.servicios[0].precioSugerido) >= 0;
    const ciudadOK = typeof form.ciudad === "string" && form.ciudad.trim().length > 0;
    const zonasOK = Array.isArray(form.zonasCobertura) && form.zonasCobertura.length >= 1;

    return {
      fotoOK,
      bioOK,
      espOK,
      servOK,
      ciudadOK,
      zonasOK,
      all: fotoOK && bioOK && espOK && servOK && ciudadOK && zonasOK,
    };
  }, [form]);

  // ------- Guardar -------
  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        ...form,
        aniosExperiencia: Number(form.aniosExperiencia) || 0,
        tarifaBase: form.tarifaBase === "" ? null : Number(form.tarifaBase),
        certificaciones: Array.isArray(form.certificaciones) ? form.certificaciones : [],
        disponibilidadTxt: form.disponibilidadTxt || "",
        telefono: (form.telefono || "").trim(),
        servicios: (form.servicios || [])
          .map((s) => ({
            nombre: String(s.nombre || "").trim(),
            precioSugerido:
              s.precioSugerido === "" || s.precioSugerido == null
                ? 0
                : Number(s.precioSugerido),
          }))
          .filter((s) => s.nombre),
      };
      await saveMyTechnicianDoc(user.uid, payload);
      setMsg({ type: "ok", text: "Cambios guardados." });
      const data = await getMyTechnicianDoc(user.uid);
      setDocTech(data);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "No pudimos guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  // ------- Publicar / Ocultar -------
  const onPublish = async () => {
    if (!user) return;
    setPubLoading(true);
    setMsg({ type: "", text: "" });
    try {
      if (!checklist.all) {
        setMsg({
          type: "error",
          text:
            "Te faltan campos para publicar: foto, bio (≥120), 1 especialidad, 1 servicio con precio, ciudad y al menos 1 zona.",
        });
        setPubLoading(false);
        return;
      }
      await onSave();
      await setPublicado(user.uid, true);
      setMsg({ type: "ok", text: "¡Tu perfil ya está publicado en el catálogo!" });
      const data = await getMyTechnicianDoc(user.uid);
      setDocTech(data);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "No pudimos publicar el perfil." });
    } finally {
      setPubLoading(false);
    }
  };

  const onUnpublish = async () => {
    if (!user) return;
    setPubLoading(true);
    setMsg({ type: "", text: "" });
    try {
      await setPublicado(user.uid, false);
      setMsg({ type: "ok", text: "Tu perfil se ha ocultado del catálogo." });
      const data = await getMyTechnicianDoc(user.uid);
      setDocTech(data);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "No pudimos ocultar el perfil." });
    } finally {
      setPubLoading(false);
    }
  };

  if (loading || authLoading) return <div className="p-6">Cargando tu perfil…</div>;

  // ------- Thumbnails Cloudinary -------
  const avatar56 = form.fotoURL ? clThumb(form.fotoURL, { w: 56, h: 56 }) : DEFAULT_AVATAR;
  const avatar80 = form.fotoURL ? clThumb(form.fotoURL, { w: 80, h: 80 }) : DEFAULT_AVATAR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Avatar grande */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                    <img src={avatar80} alt={form.nombre || "Foto"} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Mi Perfil Técnico
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Completa tu perfil y publícalo para aparecer en el catálogo
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${docTech?.publicado ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">
                        {docTech?.publicado ? 'Perfil Público' : 'Perfil Privado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        Checklist: {checklist.all ? 
                          <span className="text-emerald-600 font-semibold">Completo ✓</span> : 
                          <span className="text-amber-600 font-semibold">Pendiente</span>
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción mejorados */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={onSave} 
                  disabled={saving || pubLoading} 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-medium"
                >
                  <Save className="w-5 h-5" /> 
                  {saving ? "Guardando…" : "Guardar"}
                </button>

                {!docTech?.publicado ? (
                  <button 
                    onClick={onPublish} 
                    disabled={saving || pubLoading} 
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:scale-105"
                  >
                    <Globe className="w-5 h-5" /> 
                    {pubLoading ? "Publicando…" : "Publicar Perfil"}
                  </button>
                ) : (
                  <button 
                    onClick={onUnpublish} 
                    disabled={saving || pubLoading} 
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                  >
                    <Eye className="w-5 h-5" /> 
                    {pubLoading ? "Actualizando…" : "Ocultar Perfil"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes mejorados */}
        {msg.text && (
          <div className={`mb-6 rounded-2xl border-2 p-4 backdrop-blur-sm ${
            msg.type === "error" 
              ? "bg-red-50/80 text-red-700 border-red-200" 
              : "bg-emerald-50/80 text-emerald-700 border-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              {msg.type === "error" ? 
                <X className="w-5 h-5 text-red-500" /> : 
                <Check className="w-5 h-5 text-emerald-500" />
              }
              <span className="font-medium">{msg.text}</span>
            </div>
          </div>
        )}

        {/* Resumen del perfil mejorado */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Vista Previa del Perfil</h2>
            </div>
            
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-gradient shadow-xl">
                  <img src={avatar80} alt={form.nombre || "Foto"} className="w-full h-full object-cover" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{form.nombre || "Tu nombre aparecerá aquí"}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{form.ciudad || "Ciudad por definir"}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {form.bioCorta ? 
                      form.bioCorta.slice(0, 200) + (form.bioCorta.length > 200 ? "…" : "") : 
                      "Tu biografía profesional aparecerá aquí. Cuéntanos sobre tu experiencia y servicios."
                    }
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {form.especialidades.length > 0 ? 
                    form.especialidades.slice(0, 3).map((esp, i) => (
                      <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl text-sm font-medium">
                        {esp}
                      </span>
                    )) :
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-xl text-sm">
                      Añade especialidades
                    </span>
                  }
                  {form.especialidades.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-sm">
                      +{form.especialidades.length - 3} más
                    </span>
                  )}
                </div>
              </div>
              
              {/* Indicadores de checklist mejorados */}
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${checklist.fotoOK ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Foto</span>
                  {checklist.fotoOK && <Check className="w-4 h-4" />}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${checklist.bioOK ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Bio</span>
                  {checklist.bioOK && <Check className="w-4 h-4" />}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${checklist.espOK ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm font-medium">Skills</span>
                  {checklist.espOK && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formularios mejorados */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Columna 1 - Información Personal */}
          <div className="space-y-6">
            {/* Tarjeta de Foto y Datos Básicos */}
            <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
              </div>

              {/* Foto */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-gradient shadow-lg">
                      <img src={avatar80} alt="Foto" className="w-full h-full object-cover" />
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setMsg({ type: "", text: "" });
                            const { secureUrl } = await uploadToCloudinary(file, { folder: "tech_photos" });
                            set("fotoURL", secureUrl);
                            await saveMyTechnicianDoc(user.uid, { fotoURL: secureUrl });
                            setMsg({ type: "ok", text: "Foto subida y guardada." });
                          } catch (err) {
                            console.error(err);
                            setMsg({ type: "error", text: err.message || "No pudimos subir tu foto." });
                          }
                        }}
                      />
                    </label>
                  </div>
                  {form.fotoURL && (
                    <a 
                      className="text-sm inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium" 
                      href={form.fotoURL} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <CloudUpload className="w-4 h-4" /> Ver imagen actual
                    </a>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  Nombre Público
                </label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej. Lina López"
                />
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Biografía Profesional
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">Mín. 120 caracteres</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none resize-none"
                  rows={5}
                  value={form.bioCorta}
                  onChange={(e) => set("bioCorta", e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia profesional, herramientas especializadas, garantías que ofreces, certificaciones, etc. Esta información ayudará a los clientes a conocerte mejor."
                />
                <div className={`text-sm mt-2 flex items-center gap-2 ${checklist.bioOK ? "text-emerald-600" : "text-gray-500"}`}>
                  {checklist.bioOK ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {form.bioCorta?.trim()?.length || 0} / 120 caracteres
                </div>
              </div>

              {/* Ciudad */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Ciudad Principal
                </label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                  value={form.ciudad}
                  onChange={(e) => set("ciudad", e.target.value)}
                  placeholder="Ej. Medellín, Bogotá, Cali..."
                />
              </div>

              {/* Teléfono */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Teléfono de Contacto
                </label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="+57 3xx xxx xxxx"
                />
              </div>

              {/* Disponibilidad */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Horarios de Disponibilidad
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none resize-none"
                  rows={3}
                  value={form.disponibilidadTxt}
                  onChange={(e) => set("disponibilidadTxt", e.target.value)}
                  placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 9:00 AM - 1:00 PM"
                />
              </div>

              {/* Switch disponible */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-emerald-800">¿Disponible para nuevos trabajos?</label>
                    <p className="text-xs text-emerald-600">Los clientes podrán contactarte para reservar servicios</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!form.disponible}
                  onChange={(e) => set("disponible", e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Zonas de Cobertura */}
            <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Zonas de Cobertura</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">Mínimo 1</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {ZONAS_PREDEF.map((z) => {
                  const active = form.zonasCobertura.includes(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleZona(z)}
                      className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 font-medium ${
                        active 
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg transform scale-105" 
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {z}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna 2 - Servicios y Especialidades */}
          <div className="space-y-6">
            {/* Especialidades */}
            <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Especialidades</h3>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">Mínimo 1</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ESPECIALIDADES.map((esp) => {
                  const active = form.especialidades.includes(esp);
                  return (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => toggleEspecialidad(esp)}
                      className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 font-medium text-sm ${
                        active 
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg" 
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {esp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Servicios */}
            <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Servicios y Precios</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">Mínimo 1</span>
                </div>
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105" 
                  onClick={addServicio}
                >
                  <Plus className="w-4 h-4" /> Añadir Servicio
                </button>
              </div>

              <div className="space-y-4">
                {form.servicios.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre del servicio</label>
                        <input
                          className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 outline-none"
                          placeholder="Ej. Reparación de nevera"
                          value={s.nombre}
                          onChange={(e) => setServicio(i, { nombre: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Precio sugerido (COP)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 outline-none"
                            placeholder="50000"
                            value={s.precioSugerido}
                            onChange={(e) => setServicio(i, { precioSugerido: e.target.value })}
                            min={0}
                          />
                          <button 
                            className="px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors" 
                            onClick={() => delServicio(i)}
                            title="Eliminar servicio"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {form.servicios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">Aún no has añadido servicios</p>
                    <p className="text-sm">Añade al menos un servicio con su precio sugerido</p>
                  </div>
                )}
              </div>
            </div>

            {/* Certificaciones */}
            <div className="bg-white rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Certificaciones</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">Opcional</span>
              </div>
              
              <CertificacionesEditor
                value={form.certificaciones}
                onChange={(arr) => set("certificaciones", arr)}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción finales */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button 
            onClick={onSave} 
            disabled={saving || pubLoading} 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-semibold text-lg"
          >
            <Save className="w-5 h-5" /> 
            {saving ? "Guardando cambios…" : "Guardar Cambios"}
          </button>

          {!docTech?.publicado ? (
            <button 
              onClick={onPublish} 
              disabled={saving || pubLoading || !checklist.all} 
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-200 font-semibold text-lg transform hover:scale-105 ${
                checklist.all 
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <Globe className="w-5 h-5" /> 
              {pubLoading ? "Publicando perfil…" : "Publicar en Catálogo"}
            </button>
          ) : (
            <button 
              onClick={onUnpublish} 
              disabled={saving || pubLoading} 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white shadow-xl hover:shadow-2xl transition-all duration-200 font-semibold text-lg"
            >
              <X className="w-5 h-5" /> 
              {pubLoading ? "Ocultando perfil…" : "Ocultar del Catálogo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =======================================
//   Subcomponente: Certificaciones
// =======================================
function CertificacionesEditor({ value = [], onChange }) {
  const [input, setInput] = useState("");
  
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(value || []), v]);
    setInput("");
  };
  
  const remove = (i) => onChange((value || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Certificado RETIE, EPA, Curso Refrigeración, SENA..."
          onKeyDown={(e) => { 
            if (e.key === "Enter") { 
              e.preventDefault(); 
              add(); 
            } 
          }}
        />
        <button 
          type="button" 
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
          onClick={add}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {(value || []).map((c, i) => (
          <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-2xl border border-purple-200 shadow-sm">
            <Award className="w-4 h-4" />
            <span className="font-medium">{c}</span>
            <button 
              className="w-5 h-5 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center transition-colors" 
              onClick={() => remove(i)}
              title="Eliminar certificación"
            >
              <X className="w-3 h-3 text-purple-700" />
            </button>
          </div>
        ))}
        {(!value || value.length === 0) && (
          <div className="text-center py-6 text-gray-500 w-full">
            <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">Sin certificaciones añadidas</p>
            <p className="text-sm">Las certificaciones ayudan a generar más confianza</p>
          </div>
        )}
      </div>
    </div>
  );
}
