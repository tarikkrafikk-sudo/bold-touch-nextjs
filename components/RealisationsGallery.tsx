"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2 } from "lucide-react";
import type { Product } from "@/lib/products";
import type { Realisation } from "@/data/realisations";
import { useLanguage } from "./LanguageProvider";

function findMatchingProduct(cat: string, products: Product[]): Product | null {
  return products.find((p) => p.cat === cat) ?? null;
}

export default function RealisationsGallery({
  variant,
  realisations,
  products = [],
}: {
  variant: "home" | "boutique";
  realisations: Realisation[];
  products?: Product[];
}) {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const items = variant === "home" ? realisations.slice(0, 8) : realisations;

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      {variant === "home" && (
        <div className="mb-6 text-center">
          <h2 className="font-syne text-2xl font-bold text-ink md:text-3xl">
            {t("realisations.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl font-inter text-sm text-ink/60">
            {t("realisations.homeDesc")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((r, i) => {
          const match = variant === "boutique" ? findMatchingProduct(r.cat, products) : null;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 8) * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-cream2"
            >
              <button
                type="button"
                onClick={() => variant === "home" && setLightbox(r.image)}
                className="absolute inset-0 h-full w-full"
                aria-label={r.product}
              >
                <Image
                  src={r.image}
                  alt={r.product}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>

              <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 font-inter text-[11px] font-medium text-white backdrop-blur-sm">
                {r.client}
              </span>

              {variant === "boutique" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                  {match ? (
                    <Link
                      href={`/produit/${match.id}?inspiration=${encodeURIComponent(r.image)}`}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-inter text-sm font-semibold text-ink shadow-lg transition-transform hover:scale-105"
                    >
                      <Wand2 size={15} />
                      {t("realisations.customize")}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLightbox(r.image)}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-inter text-sm font-semibold text-ink shadow-lg"
                    >
                      {t("realisations.customize")}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {variant === "home" && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/boutique"
            className="rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            {t("realisations.seeMore")}
          </Link>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6"
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="relative h-[70vh] w-full max-w-2xl"
            >
              <Image src={lightbox} alt="" fill className="rounded-xl object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
