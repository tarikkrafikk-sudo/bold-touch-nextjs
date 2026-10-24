"use client";

import { motion } from "framer-motion";

const logoColors = [
  "#FF2D8A",
  "#FF8A1E",
  "#FFD60A",
  "#00C8FF",
  "#FF2D8A",
  "#7A5CFA",
  "#FF8A1E",
  "#00C8FF",
  "#FF2D8A",
  "#7A5CFA",
]; // rose, orange, yellow, cyan, purple = exact logo palette (10 entries for "BOLD TOUCH")

export default function BubbleText({
  size = "text-5xl",
  gap = "2px",
  variant = "header",
}: {
  size?: string;
  gap?: string;
  variant?: "header" | "hero";
}) {
  const isHero = variant === "hero";

  return (
    <div
      dir="ltr"
      className={`flex font-bold uppercase ${size}`}
      style={{
        gap,
        fontFamily: "'Clash Display', 'Syne', sans-serif",
        letterSpacing: isHero ? "-0.03em" : "-0.02em",
        lineHeight: isHero ? 0.9 : 1,
        filter: isHero ? undefined : "drop-shadow(0 1px 0 rgba(0,0,0,0.05))",
        textShadow: isHero ? "0 4px 20px rgba(0,0,0,0.08)" : undefined,
        transform: isHero ? "perspective(1000px)" : undefined,
      }}
    >
      {"BOLD TOUCH".split("").map((char, i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -14, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.55,
            delay: i * 0.07,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeOut",
          }}
          style={{
            color: char === " " ? "transparent" : logoColors[i],
            display: "inline-block",
            fontFamily: "'Clash Display', 'Syne', sans-serif",
            fontWeight: 700,
            minWidth: char === " " ? "15px" : "auto",
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </div>
  );
}
