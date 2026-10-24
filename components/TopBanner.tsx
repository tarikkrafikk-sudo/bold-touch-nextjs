"use client";

import { useLanguage } from "./LanguageProvider";

export default function TopBanner() {
  const { t } = useLanguage();
  return (
    <div className="bg-[#F3EADC] text-ink text-center text-[11px] md:text-xs font-medium tracking-wide py-2 px-4">
      {t("banner.text")}
    </div>
  );
}
