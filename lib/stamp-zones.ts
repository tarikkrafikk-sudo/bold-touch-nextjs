import type { Category } from "./products";

export interface StampZone {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: number;
  radius: string;
}

const ZONES: Record<Category, StampZone> = {
  mugs: { top: "32%", left: "33%", width: "34%", height: "32%", rotate: -2, radius: "10px" },
  verres: { top: "20%", left: "37%", width: "26%", height: "48%", rotate: 0, radius: "14px" },
  tshirts: { top: "26%", left: "32%", width: "36%", height: "32%", rotate: 0, radius: "8px" },
  coussins: { top: "18%", left: "18%", width: "64%", height: "64%", rotate: -1, radius: "16px" },
  accessoires: { top: "24%", left: "24%", width: "52%", height: "52%", rotate: 1, radius: "12px" },
};

export function getStampZone(cat: Category): StampZone {
  return ZONES[cat] ?? ZONES.accessoires;
}
