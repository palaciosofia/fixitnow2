// src/utils/cloudinary.js
/**
 * Genera un thumbnail Cloudinary insertando transformaciones en la URL.
 * No re-sube nada, solo transforma por URL.
 *
 * @param {string} url - secure_url que te devolvió Cloudinary al subir
 * @param {object} opts
 * @param {number} opts.w - width deseado (px)
 * @param {number} opts.h - height deseado (px)
 * @param {string} opts.crop - modo de recorte (fill|fit|limit|thumb...)
 * @param {string} opts.gravity - g_auto centra la cara/objeto
 * @param {string|number} opts.dpr - densidad (auto para HiDPI)
 * @param {string|number} opts.quality - calidad (auto o número)
 * @param {string} opts.format - formato (auto|jpg|webp|avif)
 * @returns {string} URL transformada
 */
export function clThumb(
  url,
  {
    w = 300,
    h = 300,
    crop = "fill",
    gravity = "auto",
    dpr = "auto",
    quality = "auto",
    format = "auto",
  } = {}
) {
  if (typeof url !== "string" || !url.includes("/upload/")) return url || "";

  const transform = [
    `f_${format}`,      // formato óptimo
    `q_${quality}`,     // calidad automática
    `dpr_${dpr}`,       // retina/HiDPI
    `w_${w}`,           // ancho
    `h_${h}`,           // alto
    `c_${crop}`,        // modo de recorte
    `g_${gravity}`,     // foco automático
  ].join(",");

  // Inserta la transformación justo después de '/upload/'
  return url.replace("/upload/", `/upload/${transform}/`);
}

/**
 * Versión ultra-pequeña borrosa (placeholder/LQIP) para efectos de carga progresiva.
 */
export function clBlurPlaceholder(url, { w = 24, h = 24 } = {}) {
  if (typeof url !== "string" || !url.includes("/upload/")) return url || "";
  const t = [`w_${w}`, `h_${h}`, "c_fill", "e_blur:800", "q_10", "f_auto"].join(",");
  return url.replace("/upload/", `/upload/${t}/`);
}
