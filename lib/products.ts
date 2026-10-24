export type Category = "mugs" | "verres" | "tshirts" | "coussins" | "accessoires";
export type Badge = "bestseller" | "new" | "gift" | null;

export interface LocalizedText {
  fr: string;
  en?: string;
  ar?: string;
}

export interface Product {
  id: string;
  cat: Category;
  price: number;
  compareAt: number | null;
  image: string;
  colors: string[];
  sizes: string[] | null;
  badge: Badge;
  rating: number;
  reviews: number;
  name: LocalizedText;
  desc: LocalizedText;
}

export const categoryIds: ("tout" | Category)[] = [
  "tout",
  "mugs",
  "verres",
  "tshirts",
  "coussins",
  "accessoires",
];

// French-only labels for the admin backoffice (not user-facing / not localized).
export const categoryLabelsFr: Record<Category, string> = {
  mugs: "Mugs",
  verres: "Verres",
  tshirts: "T-shirts",
  coussins: "Coussins",
  accessoires: "Accessoires",
};

const colorMap: Record<string, string> = {
  Blanc: "#FFFFFF",
  Noir: "#111111",
  Sable: "#D8C9A3",
  Terracotta: "#C1704A",
  Ivoire: "#F5EFE2",
  Anthracite: "#3A3A3A",
  Transparent: "#E8E8E8",
  Orange: "#E8793A",
  Rose: "#E8A3B5",
  Vert: "#5C7A5C",
  Bleu: "#5B7B9A",
  Jaune: "#E3C04A",
  Marron: "#6B4A33",
  Violet: "#7A5C8A",
  Naturel: "#E3D5B8",
  Mauve: "#B99FC2",
  Fuchsia: "#C23B7A",
  Dégradé:
    "linear-gradient(90deg,#E8793A,#E8A3B5,#C23B7A,#5C7A5C,#E3C04A,#5B7B9A)",
};

export function colorSwatch(name: string): string {
  return colorMap[name] ?? "#CCCCCC";
}
