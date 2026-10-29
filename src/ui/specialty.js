// src/ui/specialty.js
// Ícono y colores de cada especialidad, para cuando el técnico no tiene foto.
import { Droplets, Zap, Snowflake, Hammer, KeyRound, WashingMachine, Paintbrush, Flame, Wrench } from "lucide-react";

const SPECIALTY_VISUALS = [
  { match: /plom|agua|tuber|grif/i, icon: Droplets, cls: "bg-[#E3ECF7] text-[#5B7BA8]" },
  { match: /electri|ilumin|led|solar|cctv|domótica|domotica/i, icon: Zap, cls: "bg-[#FBF1D9] text-[#A07A1F]" },
  { match: /aire|refrig/i, icon: Snowflake, cls: "bg-[#E0F1F3] text-[#3F8791]" },
  { match: /carpin|mueble|ensamble|drywall|yeso|piso|baldos|enchap/i, icon: Hammer, cls: "bg-[#F2E7DA] text-[#9A6B3E]" },
  { match: /cerraj|llave/i, icon: KeyRound, cls: "bg-[#ECE9F6] text-[#6B5FA8]" },
  { match: /lavad|never|secad|electrodom/i, icon: WashingMachine, cls: "bg-[#E8F2E6] text-[#4F7F49]" },
  { match: /pint|estuco|impermeab/i, icon: Paintbrush, cls: "bg-[#FCE7F3] text-[#9D3D6C]" },
  { match: /gas|sold/i, icon: Flame, cls: "bg-[#FDE8DD] text-[#A4532B]" },
];

export function specialtyVisual(specialty = "") {
  return (
    SPECIALTY_VISUALS.find((v) => v.match.test(specialty)) || {
      icon: Wrench,
      cls: "bg-[#EEF0F4] text-[#5F6675]",
    }
  );
}

