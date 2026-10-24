"use client";

import SimplePage from "@/components/SimplePage";
import { useLanguage } from "@/components/LanguageProvider";
import { Instagram, Mail, Phone } from "lucide-react";
import { TikTokIcon, WhatsAppIcon } from "@/components/icons";

export default function Contact() {
  const { t } = useLanguage();

  const items = [
    {
      icon: <WhatsAppIcon className="h-5 w-5 text-white" />,
      iconClass: "bg-[#25D366] shadow-[0_0_18px_rgba(37,211,102,0.45)]",
      label: t("contact.whatsapp"),
      value: "+212 642 99 96 92",
      href: "https://wa.me/212642999692",
      external: true,
    },
    {
      icon: <Phone size={19} className="text-white" />,
      iconClass: "bg-[#0A84FF] shadow-[0_0_18px_rgba(10,132,255,0.4)]",
      label: t("contact.phone"),
      value: "+212 642 99 96 92",
      href: "tel:+212642999692",
      external: false,
    },
    {
      icon: <Mail size={19} className="text-white" />,
      iconClass: "bg-gradient-to-br from-[#4285F4] to-[#34A853] shadow-[0_0_18px_rgba(66,133,244,0.35)]",
      label: t("contact.directEmail"),
      value: "alaha7756@gmail.com",
      href: "mailto:alaha7756@gmail.com",
      external: false,
    },
    {
      icon: <Instagram size={19} className="text-white" />,
      iconClass: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] shadow-[0_0_18px_rgba(221,42,123,0.35)]",
      label: t("contact.instagram"),
      value: "@bold_touch05_37",
      href: "https://www.instagram.com/bold_touch05_37/",
      external: true,
    },
    {
      icon: <TikTokIcon className="h-5 w-5 text-white" />,
      iconClass: "bg-black",
      iconStyle: { boxShadow: "0 0 0 2px #25F4EE, 0 0 0 4px #FE2C55" },
      label: t("contact.tiktok"),
      value: "@bold.touch8",
      href: "https://www.tiktok.com/@bold.touch8?_r=1&_t=ZS-9AgdrswtD3o",
      external: true,
    },
  ];

  return (
    <SimplePage eyebrow={t("nav.contact")} title={t("contact.title")}>
      <ul className="mx-auto w-full max-w-2xl space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
              style={item.iconStyle}
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/50">
                {item.label}
              </p>
              <a
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                dir="ltr"
                className="inline-block font-inter text-[15px] font-semibold text-ink underline underline-offset-2 hover:text-gold break-all"
              >
                {item.value}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </SimplePage>
  );
}
