// Une clases de Tailwind ignorando valores vacíos: cx("a", cond && "b")
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// Iniciales para avatares: "Carlos Mendoza" → "CM"
export function initials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Paleta suave para avatares sin foto (se elige de forma estable por nombre)
const AVATAR_TONES = [
  "bg-[#FDE2D2] text-[#8A3A0B]",
  "bg-[#DCE8F7] text-[#0A3D8F]",
  "bg-[#E9E3F7] text-[#4A2D8F]",
  "bg-[#DFF0E8] text-[#0B5A3B]",
  "bg-[#FEF3C7] text-[#92400E]",
  "bg-[#FCE7F3] text-[#9D174D]",
];

export function avatarTone(seed = "") {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
