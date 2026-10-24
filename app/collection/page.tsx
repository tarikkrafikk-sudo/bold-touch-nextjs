"use client";

import SimplePage from "@/components/SimplePage";
import { useLanguage } from "@/components/LanguageProvider";

export default function Collection() {
  const { t } = useLanguage();
  return (
    <SimplePage eyebrow="2026" title={t("collection.title")}>
      <p>
        {t("collection.body")}{" "}
        <a href="/boutique" className="font-semibold text-ink underline">
          {t("nav.shop")}
        </a>
      </p>
    </SimplePage>
  );
}
