"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Camera } from "lucide-react";
import Header from "@/components/Header";
import TopBanner from "@/components/TopBanner";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";
import type { PhotoShape } from "@/components/CartProvider";
import { useLanguage } from "@/components/LanguageProvider";

// NEW FEATURE: human-readable shape label, shared with ProductConfigurator's
// own copy (kept local here to avoid a cross-component import cycle).
function shapeLabel(shape?: PhotoShape) {
  switch (shape) {
    case "circle":
      return "Cercle";
    case "heart":
      return "Coeur";
    case "square":
      return "Carré";
    default:
      return "Arrondi";
  }
}

export default function CartPage() {
  const { t } = useLanguage();
  const { items, updateQty, removeItem, clearCart, totalPrice } = useCart();

  function buildMessage() {
    let msg = `COMMANDE BOLD TOUCH 🛒\n\n`;
    items.forEach((l, i) => {
      msg += `${i + 1}. ${l.name}\n`;
      msg += `${[l.color && `Couleur: ${l.color}`, l.size && `Taille: ${l.size}`, `Qté: ${l.qty}`].filter(Boolean).join(" - ")}\n`;
      msg += `Prix: ${l.price * l.qty} MAD\n\n`;

      if (l.finalPreview) {
        msg += `🖼️ APERÇU FINAL: Voir panier\n\n`;
      }

      // Only a real https:// link is any use to the atelier — a
      // leftover local path can't be opened outside this machine.
      if (l.uploadedPhotos && l.uploadedPhotos.length > 0) {
        msg += `📸 ${l.uploadedPhotos.length} PHOTO(S) CLIENT HD (à télécharger pour impression):\n`;
        l.uploadedPhotos.forEach((ph, idx) => {
          msg += `${idx + 1}. ${ph.url}\n`;
          msg += `   Taille: ${ph.size}% - Position x:${Math.round(ph.x)} y:${Math.round(ph.y)}\n`;
          // NEW FEATURE: shape/crop/flip summary in the WhatsApp message.
          const flips = [ph.flipH ? "Flip H" : null, ph.flipV ? "Flip V" : null].filter(Boolean);
          msg += `   Forme: ${shapeLabel(ph.shape)} - Recadrée: ${ph.cropped ? "Oui" : "Non"}${
            flips.length ? ` - ${flips.join(", ")}` : ""
          }${ph.rotate ? ` - Rotation: ${ph.rotate}°` : ""}\n`;
        });
        msg += `\n`;
      } else if (l.uploadedPhotoUrl && l.uploadedPhotoUrl.startsWith("http")) {
        msg += `📸 PHOTO CLIENT HD (à télécharger pour impression):\n${l.uploadedPhotoUrl}\n\n`;
        msg += `Position photo: ${l.photoSize ?? 100}% - x:${l.photoPos?.x ?? 0} y:${l.photoPos?.y ?? 0}\n\n`;
      }

      if (l.customText) {
        msg += `✍️ TEXTE:\n${l.customText}\n`;
        msg += `Police: ${l.selectedFontName ?? ""} - Taille: ${l.textSize ?? 100}% - Couleur: ${l.textColor ?? ""} - Pos: ${l.textPosition ?? ""}\n\n`;
      }

      msg += `---\n\n`;
    });
    msg += `TOTAL: ${totalPrice} MAD\n`;
    msg += `Livraison offerte dès 500 MAD`;
    return msg;
  }

  async function handleCheckout() {
    // Open a blank tab synchronously, *before* any await — browsers only
    // allow window.open() without being blocked as a popup when it's still
    // part of the direct click, so this reserves the tab now and we decide
    // afterwards whether it needs to navigate anywhere.
    const waWindow = window.open("", "_blank");
    const waUrl = `https://wa.me/212642999692?text=${encodeURIComponent(buildMessage())}`;

    const orderPayload = {
      cart: items,
      total: totalPrice,
      photoUrls: items.flatMap((l) =>
        l.uploadedPhotos && l.uploadedPhotos.length > 0
          ? l.uploadedPhotos.map((p) => p.url)
          : l.uploadedPhotoUrl
          ? [l.uploadedPhotoUrl]
          : []
      ),
    };

    // Fire-and-forget: Gmail copy with HD attachments. Never blocks checkout.
    fetch("/api/send-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    }).catch(() => {});

    // Try pushing the order straight to the owner's WhatsApp via the Cloud
    // API (HD files as real document attachments, zero taps needed). Only
    // when that's unavailable or fails — no token configured, or outside
    // Meta's 24h customer-service window — do we fall back to the original
    // flow: open wa.me so the customer sends it themselves, same as before.
    let sent = false;
    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      sent = Boolean(data?.sent);
    } catch {
      sent = false;
    }

    if (sent) {
      waWindow?.close();
    } else if (waWindow) {
      waWindow.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank");
    }
  }

  return (
    <>
      <TopBanner />
      <Header />
      <main className="min-h-[50vh] bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          <h1 className="font-syne text-[28px] font-bold leading-tight md:text-[36px]">
            {t("cart.title")}
          </h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-8 text-center">
              <p className="font-inter text-sm text-ink/60">{t("cart.empty")}</p>
              <Link
                href="/boutique"
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-6 font-inter text-sm font-semibold text-cream hover:opacity-90"
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-3">
                {items.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-3 sm:flex-row sm:items-center"
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-cream2">
                      {l.finalPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.finalPreview}
                          alt={t("cart.finalPreviewAlt")}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Image
                          src={l.uploadedPhotos?.[0]?.url || l.uploadedPhotoUrl || l.image}
                          alt={l.name}
                          fill
                          className="object-cover"
                        />
                      )}
                      {l.finalPreview && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center font-inter text-[8px] font-semibold uppercase tracking-wide text-white">
                          {t("cart.finalPreviewBadge")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-grotesk text-sm font-medium">{l.name}</p>
                      <p className="mt-0.5 font-inter text-xs text-ink/60">
                        {[l.color, l.size].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 font-inter text-sm font-semibold text-ink">
                        {l.price} MAD
                      </p>

                      {l.customText && (
                        <div className="mt-2 rounded-xl bg-cream2/70 px-3 py-2">
                          <p className="font-inter text-sm">
                            ✍️ {t("cart.textLabel")}:{" "}
                            <span
                              className="whitespace-pre-wrap"
                              style={{ fontFamily: l.selectedFont || undefined, color: l.textColor || undefined }}
                            >
                              {l.customText}
                            </span>
                          </p>
                          <p className="mt-0.5 font-inter text-[11px] text-ink/50">
                            {t("text.styleLabel")}: {l.selectedFontName} — {l.textSize ?? 100}% — {l.textPosition}
                          </p>
                        </div>
                      )}
                      {l.uploadedPhotos && l.uploadedPhotos.length > 0 ? (
                        <div className="mt-1.5">
                          <div className="flex flex-wrap gap-1">
                            {l.uploadedPhotos.map((ph, i) => (
                              <a
                                key={ph.id}
                                href={ph.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-black/10"
                                title={`${t("cart.viewHd")} ${i + 1}`}
                              >
                                <Image src={ph.url} alt="" fill className="object-cover" />
                              </a>
                            ))}
                          </div>
                          <p className="mt-1 font-inter text-[10px] text-ink/50">
                            Photo: {l.uploadedPhotos.length} photo(s) —{" "}
                            {l.uploadedPhotos.map((p) => `${p.size}%`).join(", ")}
                          </p>
                          {/* NEW FEATURE: shape/crop/flip summary, one line
                              per photo — "Forme: Coeur - Recadrée: Oui - Flip H" */}
                          {l.uploadedPhotos.map((p, i) => (
                            <p key={p.id} className="mt-0.5 font-inter text-[10px] text-ink/50">
                              {l.uploadedPhotos.length > 1 ? `#${i + 1} — ` : ""}
                              Forme: {shapeLabel(p.shape)} - Recadrée: {p.cropped ? "Oui" : "Non"}
                              {p.flipH ? " - Flip H" : ""}
                              {p.flipV ? " - Flip V" : ""}
                              {p.rotate ? ` - Rotation: ${p.rotate}°` : ""}
                            </p>
                          ))}
                        </div>
                      ) : (
                        l.uploadedPhotoUrl && (
                          <div className="mt-1.5 flex items-center gap-2 font-inter text-xs text-ink/60">
                            <Camera size={12} />
                            {t("cart.photoAdded")} {l.photoSize ? `(${l.photoSize}%)` : ""}
                            <a
                              href={l.uploadedPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 underline underline-offset-2"
                            >
                              {t("cart.viewHd")}
                            </a>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="flex items-center gap-2 rounded-full bg-cream2 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQty(l.id, l.qty - 1)}
                          aria-label="-"
                          className="flex h-8 min-h-[32px] w-8 items-center justify-center rounded-full bg-white text-ink shadow-sm hover:bg-ink hover:text-cream"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center font-inter text-sm font-semibold">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(l.id, l.qty + 1)}
                          aria-label="+"
                          className="flex h-8 min-h-[32px] w-8 items-center justify-center rounded-full bg-white text-ink shadow-sm hover:bg-ink hover:text-cream"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(l.id)}
                        aria-label={t("cart.remove")}
                        className="flex h-9 min-h-[36px] w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {t("cart.total")}
                  </p>
                  <p className="font-syne text-2xl font-bold">{totalPrice} MAD</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="min-h-[44px] rounded-full border border-black/15 px-5 font-inter text-sm font-medium text-ink/70 hover:bg-black/5"
                  >
                    {t("cart.clear")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 font-inter text-sm font-semibold text-cream hover:bg-[#FF2D8A] transition-colors"
                  >
                    <ShoppingBag size={15} />
                    {t("cart.checkoutWhatsapp")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
