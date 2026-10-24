"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "./Header";
import TopBanner from "./TopBanner";
import Footer from "./Footer";
import { useLanguage } from "./LanguageProvider";

export default function SimplePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <>
      <TopBanner />
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-4xl px-4 pt-6 md:px-8">
          <nav className="flex items-center gap-1.5 font-inter text-xs text-ink/50">
            <Link href="/" className="hover:text-ink">{t("breadcrumb.home")}</Link>
            <ChevronRight size={12} />
            <span className="text-ink">{title}</span>
          </nav>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-syne text-[34px] font-bold leading-tight md:text-[44px]"
          >
            {title}
          </motion.h1>

          <div className="mt-8 font-inter text-[15px] leading-relaxed text-ink/75">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
