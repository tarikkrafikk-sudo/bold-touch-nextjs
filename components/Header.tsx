"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Heart, User, ShoppingBag, Instagram, Menu, X } from "lucide-react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/boutique", key: "nav.shop" },
  { href: "/personnaliser", key: "nav.customize" },
  { href: "/collection", key: "nav.collection" },
  { href: "/contact", key: "nav.contact" },
];

const ADMIN_LINK = { href: "/admin", key: "nav.admin" };

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82c-.98-.64-1.67-1.66-1.9-2.82h-2.9v12.69c0 1.28-1.03 2.31-2.31 2.31a2.31 2.31 0 1 1 0-4.62c.23 0 .45.03.66.09V9.95a5.32 5.32 0 0 0-.66-.04A5.31 5.31 0 0 0 4.2 15.22a5.31 5.31 0 0 0 5.29 5.31 5.31 5.31 0 0 0 5.31-5.31V9.02a7.2 7.2 0 0 0 4.2 1.35V7.46a4.84 4.84 0 0 1-2.4-1.64Z" />
    </svg>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-10 md:py-5">
        <div className="flex items-center gap-3 md:min-w-[220px] lg:min-w-[280px]">
          <button
            className="md:hidden rounded-full p-2 hover:bg-black/5"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo />
        </div>

        <nav className="hidden items-center gap-8 md:flex md:ml-10 lg:ml-16">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-inter text-[13px] font-medium uppercase tracking-wide text-ink/80 transition-colors hover:text-ink"
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href={ADMIN_LINK.href}
            className="font-inter text-[13px] font-medium uppercase tracking-wide text-gold/90 transition-colors hover:text-gold"
          >
            {t(ADMIN_LINK.key)}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:ml-auto md:gap-5">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <a
            href="https://www.instagram.com/bold_touch05_37/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram BOLD TOUCH"
            className="hidden rounded-full p-2 transition-colors hover:bg-black/5 sm:inline-flex"
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://www.tiktok.com/@bold.touch8?_r=1&_t=ZS-9AgdrswtD3o"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok BOLD TOUCH"
            className="hidden rounded-full p-2 transition-colors hover:bg-black/5 sm:inline-flex"
          >
            <TikTokIcon className="h-[18px] w-[18px]" />
          </a>
          <button aria-label={t("header.search")} className="rounded-full p-2 transition-colors hover:bg-black/5">
            <Search size={18} />
          </button>
          <button aria-label={t("header.wishlist")} className="hidden rounded-full p-2 transition-colors hover:bg-black/5 sm:inline-flex">
            <Heart size={18} />
          </button>
          <button aria-label={t("header.account")} className="hidden rounded-full p-2 transition-colors hover:bg-black/5 sm:inline-flex">
            <User size={18} />
          </button>
          <Link
            href="/panier"
            aria-label={t("header.cart")}
            className="relative rounded-full p-2 transition-colors hover:bg-black/5"
          >
            <ShoppingBag size={18} />
            {totalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-0.5 text-[9px] font-semibold text-cream">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-black/10 bg-cream px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 font-inter text-sm font-medium uppercase tracking-wide text-ink/80 hover:bg-black/5"
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href={ADMIN_LINK.href}
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 font-inter text-sm font-medium uppercase tracking-wide text-gold/90 hover:bg-black/5"
          >
            {t(ADMIN_LINK.key)}
          </Link>
          <div className="px-3 pt-2">
            <LanguageSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
