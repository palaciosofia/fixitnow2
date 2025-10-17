// src/Pages/Technicians/Profile.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTechBySlug } from "../../services/technicians";
import { Star, Phone, Award, MapPin } from "lucide-react";

// ⬇️ Fallbacks directos a Firestore por id o por slug
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

export default function Profile() {
  const { slug } = useParams(); // puede ser slug o id
  const nav = useNavigate();

  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setTech(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      
      let t = null;
      try {
        t = await getTechBySlug(slug);
      } catch {
        // ignoramos error del servicio y seguimos con fallback
      }

      // 2) Si no llegó nada, probar como ID del documento
      if (!t) {
        try {
          const snap = await getDoc(doc(db, "technicians", slug));
          if (snap.exists()) {
            t = { id: snap.id, ...snap.data() };
          }
        } catch {
          // ignore
        }
      }

      // 3) Si tampoco, probar query por campo slug
      if (!t) {
        try {
          const q = query(
            collection(db, "technicians"),
            where("slug", "==", slug),
            limit(1)
          );
          const qs = await getDocs(q);
          if (!qs.empty) {
            const d = qs.docs[0];
            t = { id: d.id, ...d.data() };
          }
        } catch {
          // ignore
        }
      }

      setTech(t || null);
      setLoading(false);
    })();
  }, [slug]);

  const phoneLink = useMemo(() => {
    const raw = (tech?.telefono || "").replace(/\D/g, "");
    return raw ? `https://wa.me/${raw}` : null;
  }, [tech]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse mb-4" />
        <div className="h-6 w-64 bg-gray-200 animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-2">Perfil no disponible</h1>
        <p className="text-gray-600 mb-4">
          El técnico no existe o no está publicado.
        </p>
        <button className="underline" onClick={() => nav("/tecnicos")}>
          Volver al catálogo
        </button>
      </div>
    );
  }

  const foto =
    tech.fotoURL || tech.fotoUrl || "https://via.placeholder.com/800x400?text=Tecnico";
  const nombre = tech.nombre || "Técnico";
  const ciudad = tech.ciudad || "—";
  const barrio = tech.barrio ? ` • ${tech.barrio}` : "";
  const rating =
    Number.isFinite(tech.ratingPromedio) ? Number(tech.ratingPromedio).toFixed(1) : "—";
  const reseñas = tech["reseñasCount"] ?? 0;
  const especialidades = Array.isArray(tech.especialidades) ? tech.especialidades : [];
  const servicios = Array.isArray(tech.servicios) ? tech.servicios : [];
  const certificaciones = Array.isArray(tech.certificaciones) ? tech.certificaciones : [];
  const licencias = Array.isArray(tech.licencias) ? tech.licencias : [];
  const zonasCobertura = Array.isArray(tech.zonasCobertura) ? tech.zonasCobertura : [];

  // Asegurar que tengamos id de doc para reservar
  const tid = tech.id || tech.uid || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header hero: imagen de fondo, avatar y acciones */}
      <div className="rounded-2xl overflow-hidden shadow-sm mb-6 bg-gradient-to-b from-white to-gray-50">
        <div className="relative">
          <div
            className="w-full h-40 md:h-56 bg-center bg-cover"
            style={{ backgroundImage: `url(${foto})`, filter: "brightness(0.75)" }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-end p-4 md:p-6">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 w-full">
              <img src={foto} alt={nombre} className="w-20 h-20 rounded-full object-cover border-2 border-white" />
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{nombre}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-500" /> {ciudad}{barrio}</span>
                  <span className="text-sm text-amber-600 flex items-center gap-1"><Star className="w-4 h-4" /> {rating} <span className="text-xs text-gray-500">({reseñas})</span></span>
                  {Number.isFinite(tech.añosExperiencia) && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{tech.añosExperiencia} año{tech.añosExperiencia === 1 ? "" : "s"}</span>}
                  {tech.verificado && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Verificado</span>}
                </div>
                {!!especialidades.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {especialidades.map((e, i) => (
                      <span key={i} className="text-xs bg-gray-100 rounded px-2 py-0.5">{e}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 text-white font-semibold shadow"
                  disabled={!tid}
                  onClick={() => tid && nav(`/agendar/${tid}`)}
                >
                  Reservar
                </button>
                {phoneLink ? (
                  <a href={phoneLink} target="_blank" rel="noreferrer" className="text-sm text-gray-700 bg-white px-3 py-1 rounded-full border">Contactar</a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sobre mí */}
      {tech.bioCorta && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2">Sobre mí</h2>
          <p className="text-gray-700">{tech.bioCorta}</p>
        </section>
      )}

      {/* Servicios y tarifas: tarjetas horizontales más visuales */}
      {!!servicios.length && (
        <section className="mt-6">
          <h2 className="font-semibold mb-4">Servicios y tarifas</h2>
          <div className="grid gap-4">
            {servicios.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-lg">{s?.nombre || "Servicio"}</div>
                    <div className="text-xs text-gray-500">{s?.codigo || ""}</div>
                  </div>
                  {s?.descripcion && <div className="text-sm text-gray-600 mt-1">{s.descripcion}</div>}
                  <div className="text-xs text-gray-500 mt-2">{s?.tarifa ? `Tipo: ${s.tarifa}` : ""}</div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-xs text-gray-500">Desde</div>
                  <div className="text-lg font-semibold">{formatMoney(s?.precioSugerido)}</div>
                  <button
                    onClick={() => tid && nav(`/agendar/${tid}`)}
                    className="mt-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-sm"
                    disabled={!tid}
                  >
                    Reservar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificaciones y licencias (cards) */}
      {(!!certificaciones.length || !!licencias.length) && (
        <section className="mt-6 grid md:grid-cols-2 gap-4">
          {!!certificaciones.length && (
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold">Certificaciones</h2>
              </div>
              <ul className="space-y-2 text-gray-700">
                {certificaciones.map((c, i) => (
                  <li key={i} className="text-sm">• {c}</li>
                ))}
              </ul>
            </div>
          )}
          {!!licencias.length && (
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">Licencias</h2>
              </div>
              <ul className="space-y-2 text-gray-700">
                {licencias.map((l, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{l.tipo}</span>
                    {l.entidad ? ` — ${l.entidad}` : ""}
                    {l.numero ? ` #${l.numero}` : ""}
                    {l.vence ? ` (vence: ${formatDate(l.vence)})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Cobertura */}
      {!!zonasCobertura.length && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2">Cobertura</h2>
          <div className="flex flex-wrap gap-1">
            {zonasCobertura.map((z, i) => (
              <span key={i} className="text-xs bg-gray-100 rounded px-2 py-0.5">
                {z}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Disponibilidad (horarios) */}
      {tech.horarios && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2">Disponibilidad</h2>
          <div className="text-sm text-gray-700 space-y-1">
            {Object.entries(tech.horarios).map(([dia, franjas]) => (
              <div key={dia}>
                <span className="font-medium mr-2">{diaToLabel(dia).toUpperCase()}:</span>
                {Array.isArray(franjas) && franjas.length > 0 ? (
                  franjas.map((f, i) => (
                    <span key={i} className="mr-2">
                      {f.inicio}–{f.fin}
                    </span>
                  ))
                ) : (
                  <span>No atiende</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}

// Acepta claves: lun, mar, mie, jue, vie, sab, dom (o variantes)
function diaToLabel(k) {
  const map = {
    lun: "Lun",
    mar: "Mar",
    mie: "Mié",
    jue: "Jue",
    vie: "Vie",
    sab: "Sáb",
    dom: "Dom",
    l: "Lun", m: "Mar", x: "Mié", j: "Jue", v: "Vie", s: "Sáb", d: "Dom",
  };
  return map[k?.toLowerCase?.()] || k || "";
}
