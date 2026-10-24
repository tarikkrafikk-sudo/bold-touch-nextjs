"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Instagram } from "lucide-react";
import Header from "./Header";
import TopBanner from "./TopBanner";
import Footer from "./Footer";
import CategoryFilters from "./CategoryFilters";
import ProductCard from "./ProductCard";
import HomeHero from "./HomeHero";
import ReviewsSection from "./ReviewsSection";
import RealisationsGallery from "./RealisationsGallery";
import type { Product } from "@/lib/products";
import type { Realisation } from "@/data/realisations";
import { useLanguage } from "./LanguageProvider";

type BoutiqueTab = "products" | "realisations";

type SortKey = "pertinence" | "prix-asc" | "prix-desc" | "nouveautes";

const SORT_KEY: Record<SortKey, string> = {
  pertinence: "shop.sort.pertinence",
  "prix-asc": "shop.sort.priceAsc",
  "prix-desc": "shop.sort.priceDesc",
  nouveautes: "shop.sort.new",
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82c-.98-.64-1.67-1.66-1.9-2.82h-2.9v12.69c0 1.28-1.03 2.31-2.31 2.31a2.31 2.31 0 1 1 0-4.62c.23 0 .45.03.66.09V9.95a5.32 5.32 0 0 0-.66-.04A5.31 5.31 0 0 0 4.2 15.22a5.31 5.31 0 0 0 5.29 5.31 5.31 5.31 0 0 0 5.31-5.31V9.02a7.2 7.2 0 0 0 4.2 1.35V7.46a4.84 4.84 0 0 1-2.4-1.64Z" />
    </svg>
  );
}

function SocialStrip() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/10 bg-white px-6 py-4"
      >
        <p className="font-syne text-sm font-bold uppercase tracking-wide text-ink">
          {t("social.follow")}
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/bold_touch05_37/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-4 py-2 font-inter text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
          >
            <Instagram size={15} />
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@bold.touch8?_r=1&_t=ZS-9AgdrswtD3o"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-inter text-xs font-semibold text-cream shadow-sm transition-transform hover:scale-105"
          >
            <TikTokIcon className="h-[15px] w-[15px]" />
            TikTok
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function BoutiqueClient({
  products,
  realisations = [],
  isHome = false,
}: {
  products: Product[];
  realisations?: Realisation[];
  isHome?: boolean;
}) {
  const [active, setActive] = useState("tout");
  const [sort, setSort] = useState<SortKey>("pertinence");
  const [tab, setTab] = useState<BoutiqueTab>("products");
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    let list =
      active === "tout" ? products : products.filter((p) => p.cat === active);

    list = [...list];
    if (sort === "prix-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "prix-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "nouveautes")
      list.sort((a, b) => (b.badge === "new" ? 1 : 0) - (a.badge === "new" ? 1 : 0));

    return list;
  }, [products, active, sort]);

  return (
    <>
      <TopBanner />
      <Header />

      <main className="bg-cream">
        {isHome && <HomeHero />}
        <SocialStrip />

        {isHome && <RealisationsGallery variant="home" realisations={realisations} />}

        {!isHome && (
          <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
            <div className="inline-flex rounded-full border border-black/10 bg-white p-1">
              <button
                type="button"
                onClick={() => setTab("products")}
                className={`rounded-full px-4 py-2 font-inter text-sm font-semibold transition-colors ${
                  tab === "products" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {t("shop.tab.products")}
              </button>
              <button
                type="button"
                onClick={() => setTab("realisations")}
                className={`rounded-full px-4 py-2 font-inter text-sm font-semibold transition-colors ${
                  tab === "realisations" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {t("shop.tab.realisations")}
              </button>
            </div>
          </div>
        )}

        {tab === "realisations" && !isHome ? (
          <RealisationsGallery variant="boutique" realisations={realisations} products={products} />
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
              <nav className="flex items-center gap-1.5 font-inter text-xs text-ink/50">
                <Link href="/" className="hover:text-ink">{t("breadcrumb.home")}</Link>
                <ChevronRight size={12} />
                <span className="text-ink">{t("breadcrumb.shop")}</span>
              </nav>
            </div>

            {/* Title + sort */}
            <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold"
                  >
                    {t("shop.collectionLabel")}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="font-syne text-[34px] font-bold leading-tight md:text-[48px]"
                  >
                    {t("shop.title")}
                  </motion.h1>
                </div>

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="cursor-pointer appearance-none rounded-full border border-black/15 bg-white px-5 py-2.5 pr-10 font-inter text-sm text-ink focus:outline-none"
                  >
                    {Object.entries(SORT_KEY).map(([key, tKey]) => (
                      <option key={key} value={key}>
                        {t(tKey)}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-ink/50"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
              <CategoryFilters active={active} onChange={setActive} />
            </div>

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 md:gap-x-6">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="py-20 text-center font-inter text-ink/60">
                  {t("shop.empty")}
                </p>
              )}
            </div>
          </>
        )}

        {isHome && <ReviewsSection />}
      </main>

      <Footer />
    </>
  );
}
