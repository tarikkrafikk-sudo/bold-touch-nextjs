import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products-store";

const SITE_URL = "https://bold-touch.com";

// Dynamic sitemap: static pages + every product page currently in the
// admin-editable products store. Regenerated on every request (Next.js
// re-runs this on each deploy/revalidation), so new products added via
// /admin show up here automatically without needing a code change.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/boutique`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collection`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/personnaliser`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const products = getProducts();
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/produit/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
