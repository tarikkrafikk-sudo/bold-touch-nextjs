"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import BubbleText from "./BubbleText";

export default function Logo({
  size = "normal",
  layout = "row",
  showWordmark = true,
}: {
  size?: "normal" | "large" | "hero";
  layout?: "row" | "column";
  showWordmark?: boolean;
}) {
  const bubbleSize =
    size === "hero"
      ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
      : size === "large"
      ? "text-3xl md:text-4xl"
      : "text-[20px]";
  const bubbleGap = size === "hero" ? "3px" : size === "large" ? "2px" : "1px";
  const bubbleVariant: "header" | "hero" = size === "hero" ? "hero" : "header";
  const markSize = size === "large" ? 52 : 40;
  const isHero = size === "hero";

  return (
    <motion.a
      href="/"
      aria-label="BOLD TOUCH — Accueil"
      className={`relative inline-flex select-none ${
        layout === "column"
          ? "flex-col items-center gap-3"
          : "items-center gap-2.5"
      }`}
      whileHover="hover"
      initial="initial"
    >
      {isHero ? (
        <motion.div
          className="relative mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Glowing gradient blur behind the mark */}
          <motion.div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[#FF2D8A]/20 via-[#FF8A1E]/20 to-[#00C8FF]/20 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <motion.div
            className="relative h-56 w-56 overflow-hidden rounded-full border-[6px] border-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] md:h-72 md:w-72 lg:h-80 lg:w-80"
            animate={{
              y: [0, -12, 0],
              rotate: [0, 2, -2, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.05 }}
          >
            <Image
              src="/assets/badge-circle.png"
              alt="BOLD TOUCH"
              fill
              sizes="320px"
              className="object-cover"
            />
          </motion.div>

          {/* Sparkle dots */}
          <motion.span
            aria-hidden
            className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-[#FFD60A]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span
            aria-hidden
            className="absolute -bottom-1 -left-3 h-2 w-2 rounded-full bg-[#FF2D8A]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>
      ) : (
        /* Circular brand mark — original logo artwork, gently floating */
        <motion.span
          className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-white ring-offset-1 ring-offset-black/10"
          style={{ width: markSize, height: markSize }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -3, 0],
          }}
          transition={{
            opacity: { duration: 0.5 },
            scale: { duration: 0.5 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
          variants={{
            hover: { scale: 1.08, transition: { duration: 0.25 } },
          }}
        >
          <Image
            src="/assets/badge-circle.png"
            alt="BOLD TOUCH"
            fill
            sizes="120px"
            className="object-cover"
          />
        </motion.span>
      )}

      {showWordmark && (
        <BubbleText size={bubbleSize} gap={bubbleGap} variant={bubbleVariant} />
      )}
    </motion.a>
  );
}
