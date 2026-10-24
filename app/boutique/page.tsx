import BoutiqueClient from "@/components/BoutiqueClient";
import { getProducts } from "@/lib/products-store";
import { getRealisations } from "@/lib/realisations-store";

export const dynamic = "force-dynamic";

export default function Boutique() {
  return (
    <BoutiqueClient
      products={getProducts()}
      realisations={getRealisations()}
    />
  );
}
