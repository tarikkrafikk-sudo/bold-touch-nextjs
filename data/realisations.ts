import type { Category } from "@/lib/products";

export interface Realisation {
  id: string;
  image: string;
  product: string;
  client: string;
  date: string;
  cat: Category;
}

// Legacy static export kept so any older import of `realisations` still
// works — but the live, admin-editable data now lives in
// data/realisations.json, read/written via lib/realisations-store.ts.
// Prefer getRealisations() from that store over this array.
import seed from "./realisations.json";
export const realisations: Realisation[] = seed as Realisation[];
