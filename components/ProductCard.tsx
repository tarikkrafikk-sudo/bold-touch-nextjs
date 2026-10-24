"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { colorSwatch } from "@/lib/products";
import { getLocalized } from "@/lib/i18n";
import { Minus, Plus, ShoppingBag, Star, Wand2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useCart } from "./CartProvider";

export default function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { t, locale } = useLanguage();
  const { addToCart } = useCart();
  const name = getLocalized(product.name, locale);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addToCart(
      {
        productId: product.id,
        name,
        image: product.image,
        price: product.price,
        color: product.colors[0] ?? null,
        size: product.sizes?.[0] ?? null,
      },
      qty
    );
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: (index % 8) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col"
    >
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-[20px] bg-white shadow-sm transition-shadow duration-400 group-hover:shadow-2xl">
          {product.badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                product.badge === "bestseller"
                  ? "bg-ink text-cream"
                  : product.badge === "new"
                  ? "border border-ink bg-white text-ink"
                  : "bg-gold text-ink"
              }`}
            >
              {t(`badge.${product.badge}`)}
            </span>
          )}

          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={product.image}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
              placeholder="empty"
              className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.08]"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-inter text-xs font-semibold text-ink shadow-md">
                <Wand2 size={13} />
                {t("product.personalize")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 px-1">
          <h3 className="font-grotesk text-[15px] font-medium leading-snug text-ink">
            {name}
          </h3>

          <div className="flex items-center gap-1">
            <Star size={13} className="fill-gold text-gold" />
            <span className="font-inter text-xs text-ink/60">
              {product.rating.toFixed(1)}
              {product.reviews > 0 && ` (${product.reviews})`}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c}
                title={c}
                className="h-3.5 w-3.5 rounded-full border border-black/10"
                style={{ background: colorSwatch(c) }}
              />
            ))}
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-inter text-[15px] font-semibold text-ink">
              {product.price} MAD
            </span>
            {product.compareAt && (
              <span className="font-inter text-[13px] text-ink/40 line-through">
                {product.compareAt} MAD
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-2.5 flex items-center gap-2 px-1">
        <div className="flex items-center gap-1 rounded-full bg-cream2 px-1 py-1">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="-"
            className="flex h-7 w-7 min-h-[28px] items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-ink hover:text-cream"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center font-inter text-xs font-semibold">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="+"
            className="flex h-7 w-7 min-h-[28px] items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-ink hover:text-cream"
          >
            <Plus size={12} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-inter text-[11px] font-semibold transition-colors ${
            added
              ? "bg-green-600 text-white"
              : "bg-ink text-cream hover:bg-[#FF2D8A]"
          }`}
        >
          <ShoppingBag size={13} />
          {added ? t("cart.added") : t("cart.addToCart")}
        </button>
      </div>
    </motion.article>
  );
}
