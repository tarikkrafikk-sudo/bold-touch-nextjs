import type { Metadata } from "next";
import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MobileStickyBar from "@/components/MobileStickyBar";
import CornerDecor from "@/components/CornerDecor";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "BOLD TOUCH — Atelier de Personnalisation",
  description:
    "Mugs, verres, t-shirts, coussins et accessoires personnalisés, fabriqués à la commande au Maroc. BOLD TOUCH, votre touche audacieuse.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Organization structured data so Google can show the BOLD TOUCH logo next
// to search results and in the Knowledge Panel.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BOLD TOUCH",
  url: "https://bold-touch.com",
  logo: "https://bold-touch.com/logo.png",
  sameAs: [
    "https://www.instagram.com/bold_touch05_37/",
    "https://www.tiktok.com/@bold.touch8",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;700&family=Great+Vibes&family=Caveat&family=Anton&family=Noto+Sans+Tifinagh&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-grotesk bg-cream text-ink antialiased">
        <LanguageProvider>
          <CartProvider>
            <CornerDecor />
            {children}
            <WhatsAppFloat />
            <MobileStickyBar />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
