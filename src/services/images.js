// src/services/images.js
/**
 * Sube una imagen a Cloudinary (preset "unsigned") y devuelve { secureUrl, publicId }.
 * Requiere .env con:
 *  - VITE_CLOUDINARY_CLOUD=tu_cloud_name
 *  - VITE_CLOUDINARY_PRESET=unsigned_fixit   (o el que creaste)
 */
export async function uploadToCloudinary(
  file,
  {
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD,
    uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET,
    folder = "tech_photos",
    maxBytes = 5 * 1024 * 1024, // 5 MB
  } = {}
) {
  if (!cloudName || !uploadPreset) {
    throw new Error("Faltan VITE_CLOUDINARY_CLOUD o VITE_CLOUDINARY_PRESET en .env");
  }
  if (!file) throw new Error("No file");

  // Validaciones rápidas
  const okType = /image\/(jpeg|png|webp)/.test(file.type);
  if (!okType) throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  if (file.size > maxBytes) throw new Error("La imagen supera el tamaño máximo (5MB).");

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset); // unsigned
  if (folder) form.append("folder", folder);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cloudinary error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
  };
}
