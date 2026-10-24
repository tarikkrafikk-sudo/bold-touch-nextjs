"use client";

import Link from "next/link";
import { Instagram, Mail, Phone } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { TikTokIcon, WhatsAppIcon } from "./icons";
import BubbleText from "./BubbleText";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-black/10 bg-cream2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
        <div>
          <BubbleText size="text-2xl" gap="1px" variant="header" />
          <p className="mt-3 max-w-xs font-inter text-sm leading-relaxed text-ink/70">
            {t("footer.about")}
          </p>
        </div>

        <div>
          <h4 className="font-syne text-sm font-bold uppercase tracking-wide">
            {t("footer.navigation")}
          </h4>
          <ul className="mt-4 space-y-2 font-inter text-sm text-ink/70">
            <li><Link href="/" className="hover:text-ink">{t("nav.home")}</Link></li>
            <li><Link href="/boutique" className="hover:text-ink">{t("nav.shop")}</Link></li>
            <li><Link href="/personnaliser" className="hover:text-ink">{t("nav.customize")}</Link></li>
            <li><Link href="/contact" className="hover:text-ink">{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-syne text-sm font-bold uppercase tracking-wide">
            {t("footer.followUs")}
          </h4>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href="https://www.instagram.com/bold_touch05_37/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram BOLD TOUCH"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] shadow-lg transition-transform hover:scale-110"
            >
              <Instagram size={18} className="text-white" />
            </a>
            <a
              href="https://www.tiktok.com/@bold.touch8?_r=1&_t=ZS-9AgdrswtD3o"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok BOLD TOUCH"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#25F4EE] bg-black shadow-lg transition-transform hover:scale-110"
            >
              <TikTokIcon className="h-[18px] w-[18px] text-white" />
            </a>
            <a
              href="https://wa.me/212642999692"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp BOLD TOUCH"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-white" />
            </a>
          </div>
          <ul className="mt-5 space-y-2.5 font-inter text-sm text-ink/70">
            <li className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A84FF]">
                <Phone size={11} className="text-white" />
              </span>
              <a href="tel:+212642999692" dir="ltr" className="inline-block hover:text-ink">
                +212 642 99 96 92
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EA4335]">
                <Mail size={11} className="text-white" />
              </span>
              <a href="mailto:alaha7756@gmail.com" dir="ltr" className="inline-block hover:text-ink">
                alaha7756@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-5 text-center font-inter text-xs text-ink/60 md:px-8">
        © 2026 BOLD TOUCH — {t("footer.rights")}
      </div>
    </footer>
  );
}
