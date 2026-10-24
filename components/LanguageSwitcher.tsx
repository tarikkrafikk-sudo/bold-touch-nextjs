"use client";

import { LOCALES } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1 ${className}`}
      role="group"
      aria-label="Langue"
    >
      {LOCALES.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLocale(l.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
            locale === l.id
              ? "bg-ink text-cream"
              : "text-ink/60 hover:text-ink"
          }`}
          aria-pressed={locale === l.id}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
