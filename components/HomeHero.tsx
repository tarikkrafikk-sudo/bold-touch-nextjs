"use client";

import Logo from "./Logo";
import { useLanguage } from "./LanguageProvider";

export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-5xl px-4 pb-6 pt-10 text-center md:pt-16">
      <div className="mb-6 mt-8 flex justify-center">
        <Logo size="hero" layout="column" />
      </div>
      <p
        className="mt-3 font-inter font-light uppercase text-gray-500"
        style={{ fontSize: "10px", letterSpacing: "0.4em" }}
      >
        {t("hero.tagline")}
      </p>
    </section>
  );
}
