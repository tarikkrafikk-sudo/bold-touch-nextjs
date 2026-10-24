import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F9F5EB",
        cream2: "#F9F6F0",
        ink: "#111111",
        gold: "#C9A24B",
        goldlight: "#E8D5A3",
      },
      fontFamily: {
        syne: ["Syne", "ui-sans-serif", "system-ui", "sans-serif"],
        grotesk: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(37,211,102,0.55)" },
          "70%": { boxShadow: "0 0 0 14px rgba(37,211,102,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(37,211,102,0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shine: "shine 2.6s linear infinite",
        pulseRing: "pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        fadeUp: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
