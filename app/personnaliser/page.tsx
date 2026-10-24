"use client";

import SimplePage from "@/components/SimplePage";
import { useLanguage } from "@/components/LanguageProvider";

export default function Personnaliser() {
  const { t } = useLanguage();
  return (
    <SimplePage eyebrow={t("nav.customize")} title={t("personalize.title")}>
      <p>{t("personalize.body")}</p>
      <a
        href="https://wa.me/212642999692?text=Salam%20BOLD%20TOUCH%2C%20bghit%20ncommander"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90"
      >
        {t("personalize.cta")}
      </a>
    </SimplePage>
  );
}
