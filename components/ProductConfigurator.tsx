"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  MessageCircle,
  Move,
  Type,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { colorSwatch } from "@/lib/products";
import { getLocalized } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";
import { useCart } from "./CartProvider";
import type { UploadedPhoto, PhotoShape } from "./CartProvider";
// NEW FEATURE: photo cropping modal.
import PhotoCropModal from "./PhotoCropModal";

const MAX_PHOTOS = 5;
// A photo's `size` state is a percent zoom (20–200, 100 = "normal"). It is
// rendered as a CSS width that is a fraction of the preview container, with
// PHOTO_BASE_WIDTH_PERCENT being what 100% zoom looks like. At 200% zoom the
// photo must end up visually twice as wide as at 100% — so this must stay a
// *direct* multiplier with no separate max-width cap layered on top of it
// (a hardcoded `maxWidth: "45%"` here previously clamped anything above
// ~130% zoom to the same visual size, which is why the slider looked like
// it stopped working partway through its range).
const PHOTO_BASE_WIDTH_PERCENT = 35;

// The cart's "aperçu final" is NOT captured from the live, responsive
// preview box any more. That box is a different physical CSS size on a
// 375px phone than on a desktop (different width *and* height), while the
// photo/text drag offsets are stored as raw pixel deltas recorded at
// whatever size was live when the customer dragged them. Capturing the
// live box directly therefore produced a different-looking composite
// depending on the device — on mobile the box was short and wide, so the
// text (sized in plain px) ended up tiny and badly placed relative to the
// rest of the image once that odd-aspect capture was squeezed into the
// cart's square thumbnail.
//
// Instead we render a second, hidden, FIXED 800×800 copy of the
// composition purely for capture, and convert every stored offset into
// that fixed space using the live box's *current* size as the conversion
// ratio. Percent-based values (photo width, text position) need no
// conversion — only the raw-pixel drag offsets and the px font size do.
// Result: the captured preview looks the same regardless of which device
// the customer customized on.
const CAPTURE_SIZE = 800;

const FONT_STYLES = [
  { name: "Classique", value: "'Times New Roman', serif" },
  { name: "Moderne 2026", value: "'Clash Display', sans-serif" },
  { name: "Arabe Élégant", value: "'Amiri', serif" },
  { name: "Tifinagh", value: "'Noto Sans Tifinagh', sans-serif" },
  { name: "Calligraphie", value: "'Great Vibes', cursive" },
  { name: "Bold Street", value: "'Anton', sans-serif" },
  { name: "Manuscrit", value: "'Caveat', cursive" },
  { name: "Arabe Moderne", value: "'Tajawal', sans-serif" },
  { name: "Berbère", value: "'Noto Sans Tifinagh', sans-serif" },
];

const TEXT_POSITIONS = [
  { key: "top", labelKey: "text.positionTop" },
  { key: "center", labelKey: "text.positionCenter" },
  { key: "bottom", labelKey: "text.positionBottom" },
  { key: "around", labelKey: "text.positionAround" },
] as const;

function isArabicText(value: string) {
  return /[؀-ۿ]/.test(value);
}

// NEW FEATURE: photo shape helpers (square/rounded use plain border-radius;
// circle/heart use clip-path, with the heart referencing a shared
// objectBoundingBox <clipPath> SVG def so it scales correctly whatever the
// photo's actual pixel size is — rendered once, globally, below).
function clipPathFor(shape?: PhotoShape): string | undefined {
  if (shape === "circle") return "circle(50% at 50% 50%)";
  if (shape === "heart") return "url(#bt-heart-clip)";
  return undefined;
}

function borderRadiusFor(shape?: PhotoShape): string | undefined {
  if (shape === "circle" || shape === "heart") return undefined;
  if (shape === "square") return "4px";
  return "16px"; // "rounded" (default)
}

// NEW FEATURE: flip (mirror) + rotate, applied to the inner <img> only so
// the outer wrapper's border/shadow/clip-path shape is unaffected.
function imgTransformFor(photo: { flipH?: boolean; flipV?: boolean; rotate?: number }): string {
  const sx = photo.flipH ? -1 : 1;
  const sy = photo.flipV ? -1 : 1;
  const deg = photo.rotate ?? 0;
  return `scaleX(${sx}) scaleY(${sy}) rotate(${deg}deg)`;
}

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

// MOBILE FIX (take 3): the previous two attempts both relied on
// html-to-image to screenshot a hidden clone of the preview DOM, which
// turned out to be fundamentally unreliable on mobile Safari (blank, then
// black/white captures) however that clone was hidden on the page. Instead
// of capturing the DOM at all, the final preview is now drawn directly onto
// a plain <canvas> — product mockup, each photo (clipped to its shape,
// flipped/rotated), and the text — using the 2D canvas API. This has none
// of html-to-image's cross-browser DOM-capture quirks and works the same
// way on every device.

// A unit-square (0..1) clip path for a photo's shape, so it can be scaled
// to any box size with a single ctx.scale() — the heart path is exactly
// the same 0..1 objectBoundingBox coordinates used by the CSS clip-path.
function shapePath2D(shape?: PhotoShape): Path2D {
  if (shape === "circle") {
    const p = new Path2D();
    p.arc(0.5, 0.5, 0.5, 0, Math.PI * 2);
    return p;
  }
  if (shape === "heart") {
    return new Path2D(
      "M0.5,0.92 C0.5,0.92 0.08,0.64 0.08,0.35 C0.08,0.17 0.21,0.05 0.37,0.05 C0.45,0.05 0.5,0.1 0.5,0.17 C0.5,0.1 0.55,0.05 0.63,0.05 C0.79,0.05 0.92,0.17 0.92,0.35 C0.92,0.64 0.5,0.92 0.5,0.92 Z"
    );
  }
  const p = new Path2D();
  if (shape === "square") {
    p.rect(0, 0, 1, 1);
    return p;
  }
  // "rounded" (default) — a unit rounded rect.
  const r = 0.08;
  p.moveTo(r, 0);
  p.lineTo(1 - r, 0);
  p.quadraticCurveTo(1, 0, 1, r);
  p.lineTo(1, 1 - r);
  p.quadraticCurveTo(1, 1, 1 - r, 1);
  p.lineTo(r, 1);
  p.quadraticCurveTo(0, 1, 0, 1 - r);
  p.lineTo(0, r);
  p.quadraticCurveTo(0, 0, r, 0);
  return p;
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image failed to load: ${src}`));
    img.src = src;
  });
}

// Draws `img` into the (x, y, w, h) box with CSS object-fit:"cover"
// semantics — fills the box, cropping whichever dimension overflows.
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx: number, sy: number, sw: number, sh: number;
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight;
    sw = sh * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// `colorSwatch()` is mostly a hex color but has one gradient entry
// ("Dégradé") — canvas fillStyle can't take a CSS gradient string
// directly, so build an equivalent canvas gradient from its hex stops.
function canvasFillStyle(
  ctx: CanvasRenderingContext2D,
  cssColor: string,
  width: number
): string | CanvasGradient {
  if (!cssColor.startsWith("linear-gradient")) return cssColor;
  const stops = cssColor.match(/#[0-9A-Fa-f]{6}/g) || ["#CCCCCC"];
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  stops.forEach((c, i) => grad.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c));
  return grad;
}

// Draws the customer's text, wrapped to fit, honoring position/offset/size
// exactly like the live CSS preview (same formulas, just computed for canvas).
function drawCustomText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  color: string,
  position: "top" | "center" | "bottom" | "around",
  textSize: number,
  textPos: { x: number; y: number },
  scaleX: number,
  scaleY: number,
  rtl: boolean,
  captureSize: number
) {
  const fontSizePx = (textSize * 0.18 * captureSize) / 550;
  const lineHeight = fontSizePx * 1.1;
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("direction" in ctx) {
    (ctx as CanvasRenderingContext2D & { direction: string }).direction = rtl ? "rtl" : "ltr";
  }
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  const maxWidth = captureSize * 0.8;
  const lines: string[] = [];
  text.split("\n").forEach((raw) => {
    const words = raw.split(" ");
    let current = "";
    words.forEach((w) => {
      const test = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    });
    lines.push(current);
  });

  const totalHeight = lines.length * lineHeight;
  const centerX = captureSize / 2 + textPos.x * scaleX;
  let startY: number;
  if (position === "top") {
    startY = captureSize * 0.1 + textPos.y * scaleY + lineHeight / 2;
  } else if (position === "bottom") {
    startY = captureSize * 0.9 + textPos.y * scaleY - totalHeight + lineHeight / 2;
  } else {
    startY = captureSize / 2 + textPos.y * scaleY - totalHeight / 2 + lineHeight / 2;
  }

  lines.forEach((line, i) => ctx.fillText(line, centerX, startY + i * lineHeight));
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

export default function ProductConfigurator({
  product,
  inspirationImage,
}: {
  product: Product;
  inspirationImage?: string;
}) {
  const { t, locale } = useLanguage();
  const { addToCart } = useCart();
  const name = getLocalized(product.name, locale);
  const desc = getLocalized(product.desc, locale);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showInspiration, setShowInspiration] = useState(Boolean(inspirationImage));
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // The live preview box's own current CSS size, kept in sync via
  // ResizeObserver so the canvas-based final-preview render (see
  // generateFinalPreview below) can convert pixel drag offsets into its
  // own fixed CAPTURE_SIZE space correctly however big/small the live box
  // currently is (phone, tablet, desktop, rotated, resized window...).
  const [liveSize, setLiveSize] = useState({ width: 550, height: 650 });

  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
  // A customer can personalize with several photos at once (e.g. one per
  // piece of a set) — each is independently draggable and resizable.
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // NEW FEATURE: which photo (by id) the crop modal is currently open for.
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);
  const cropTargetPhoto = uploadedPhotos.find((p) => p.id === cropTargetId) ?? null;
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [customText, setCustomText] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[1].value);
  const [textColor, setTextColor] = useState("#111111");
  const [textPosition, setTextPosition] = useState<(typeof TEXT_POSITIONS)[number]["key"]>("center");
  const [textSize, setTextSize] = useState(100);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  const selectedFontName = FONT_STYLES.find((f) => f.value === selectedFont)?.name ?? "";

  function changeTextPosition(value: (typeof TEXT_POSITIONS)[number]["key"]) {
    setTextPosition(value);
    setTextPos({ x: 0, y: 0 });
  }

  // Track the live preview box's actual rendered size (it differs a lot
  // between a 375px phone and a desktop window, and changes on rotation /
  // resize), so the hidden capture clone can convert pixel drag offsets
  // into its own fixed CAPTURE_SIZE space correctly at capture time.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setLiveSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const captureScaleX = CAPTURE_SIZE / liveSize.width;
  const captureScaleY = CAPTURE_SIZE / liveSize.height;

  // Multi-photo upload: the input allows selecting several files at once,
  // and the customer can also add more photos later, up to MAX_PHOTOS.
  async function handleMultipleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError("");

    if (uploadedPhotos.length + files.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("photo", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error || "Envoi impossible.");
          continue;
        }
        setUploadedPhotos((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: data.url, // always https://...blob.vercel-storage.com/... — never localhost
            x: 0,
            y: 0,
            size: 100,
            // NEW FEATURE: crop/shape/flip/rotate defaults for a freshly
            // uploaded photo — untouched, square-ish "rounded" shape.
            originalUrl: data.url,
            cropped: false,
            shape: "rounded",
            flipH: false,
            flipV: false,
            rotate: 0,
          },
        ]);
      }
    } catch {
      setUploadError("Connexion impossible. Réessayez.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updatePhotoOffset(id: string, dx: number, dy: number) {
    setUploadedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p))
    );
  }

  function updatePhotoSize(id: string, newSize: number) {
    setUploadedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, size: newSize } : p))
    );
  }

  function removePhoto(id: string) {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
    if (cropTargetId === id) setCropTargetId(null);
  }

  // NEW FEATURE: shape / flip / rotate controls.
  function updatePhotoShape(id: string, shape: PhotoShape) {
    setUploadedPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, shape } : p)));
  }

  function toggleFlip(id: string, axis: "h" | "v") {
    setUploadedPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? axis === "h"
            ? { ...p, flipH: !p.flipH }
            : { ...p, flipV: !p.flipV }
          : p
      )
    );
  }

  function rotatePhoto(id: string) {
    setUploadedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotate: ((p.rotate ?? 0) + 90) % 360 } : p))
    );
  }

  // NEW FEATURE: crop apply — rasterized data URL gets uploaded to Vercel
  // Blob like any other photo (so `url` is always a real https blob link,
  // never a localhost/data URL baked into the cart), then replaces that
  // photo's `url`. The original stays untouched in `originalUrl` so
  // "Recadrer" can always restart from the untouched source.
  async function handleCropApply(id: string, dataUrl: string) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("photo", blob, `crop-${id}.png`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible.");
      setUploadedPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, url: data.url, cropped: true } : p))
      );
    } catch {
      setUploadError("Recadrage impossible. Réessayez.");
    } finally {
      setCropTargetId(null);
    }
  }

  // Renders the product + positioned photo(s) + positioned text as a
  // flattened image, so the cart can show exactly what will be printed.
  // MOBILE FIX (take 3): drawn straight onto a <canvas> (see the helper
  // functions above) instead of "capturing" a hidden DOM clone with
  // html-to-image — see the long comment above shapePath2D() for why.
  async function generateFinalPreview(): Promise<string | null> {
    if (uploadedPhotos.length === 0 && !customText.trim()) return null;
    try {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = document.createElement("canvas");
      canvas.width = CAPTURE_SIZE;
      canvas.height = CAPTURE_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Background.
      ctx.fillStyle = canvasFillStyle(ctx, colorSwatch(color), CAPTURE_SIZE);
      ctx.fillRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

      // Product mockup, full-bleed cover.
      try {
        const productImg = await loadImageEl(product.image);
        drawCoverImage(ctx, productImg, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
      } catch (err) {
        console.error("Product mockup failed to load for final preview:", err);
      }

      // Each uploaded photo, clipped to its shape, flipped/rotated, with
      // a white border — drawn in the same position the customer saw it.
      for (const photo of uploadedPhotos) {
        try {
          const img = await loadImageEl(photo.url);
          const boxSize =
            (CAPTURE_SIZE * ((PHOTO_BASE_WIDTH_PERCENT * photo.size) / 100)) / 100;
          const centerX = CAPTURE_SIZE / 2 + photo.x * captureScaleX;
          const centerY = CAPTURE_SIZE / 2 + photo.y * captureScaleY;
          const boxX = centerX - boxSize / 2;
          const boxY = centerY - boxSize / 2;
          const path = shapePath2D(photo.shape);

          ctx.save();
          ctx.translate(boxX, boxY);
          ctx.scale(boxSize, boxSize);
          ctx.clip(path);
          // The clip region is now fixed in canvas device space, so the
          // transform can be freely reset to draw the (possibly
          // flipped/rotated) image without moving the clip boundary.
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.translate(centerX, centerY);
          ctx.rotate(((photo.rotate ?? 0) * Math.PI) / 180);
          ctx.scale(photo.flipH ? -1 : 1, photo.flipV ? -1 : 1);
          drawCoverImage(ctx, img, -boxSize / 2, -boxSize / 2, boxSize, boxSize);
          ctx.restore();

          // White border around the shape.
          ctx.save();
          ctx.translate(boxX, boxY);
          ctx.scale(boxSize, boxSize);
          ctx.lineWidth = 3 / boxSize;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke(path);
          ctx.restore();
        } catch (err) {
          // A single failed photo (e.g. a slow/broken Blob fetch) must
          // never blank out the whole preview — skip just that photo.
          console.error("Photo failed to load for final preview:", err);
        }
      }

      if (customText.trim()) {
        drawCustomText(
          ctx,
          customText.trim(),
          selectedFont,
          textColor,
          textPosition,
          textSize,
          textPos,
          captureScaleX,
          captureScaleY,
          isArabicText(customText),
          CAPTURE_SIZE
        );
      }

      return canvas.toDataURL("image/png", 0.95);
    } catch (err) {
      console.error("Composite preview render failed:", err);
      return null;
    }
  }

  async function handleAddToCart() {
    setGeneratingPreview(true);
    const finalPreview = await generateFinalPreview();
    setGeneratingPreview(false);

    addToCart(
      {
        productId: product.id,
        name,
        image: product.image,
        price: product.price,
        color: color || null,
        size,
        finalPreview,
        uploadedPhotos,
        customText: customText.trim() || null,
        selectedFont: customText.trim() ? selectedFont : null,
        selectedFontName: customText.trim() ? selectedFontName : null,
        textColor: customText.trim() ? textColor : null,
        textPosition: customText.trim() ? textPosition : null,
        textSize: customText.trim() ? textSize : null,
        textPos: customText.trim() ? textPos : null,
      },
      qty
    );
    setAddedToCart(true);
    setQty(1);
    setTimeout(() => setAddedToCart(false), 1800);
  }

  function buildWhatsAppMessage() {
    let msg = `🛒 COMMANDE BOLD TOUCH\nProduit: ${name}`;
    if (color) msg += ` - ${color}`;
    msg += ` - Qty: ${qty}`;
    msg += `\nPrix: ${product.price * qty} MAD`;
    if (size) msg += `\nTaille: ${size}`;
    // Each photo url is always a real https:// Vercel Blob link once
    // upload succeeds — never a localhost path, so it's usable from
    // WhatsApp off this machine.
    if (uploadedPhotos.length > 0) {
      msg += `\n📸 ${uploadedPhotos.length} PHOTO(S) CLIENT HD (à télécharger pour impression):`;
      uploadedPhotos.forEach((p, idx) => {
        msg += `\n${idx + 1}. ${p.url}`;
        msg += `\n   Taille: ${p.size}% — Position x:${Math.round(p.x)} y:${Math.round(p.y)}`;
        // NEW FEATURE: shape/crop/flip summary in the WhatsApp message.
        msg += `\n   Forme: ${shapeLabel(p.shape)} — Recadrée: ${p.cropped ? "Oui" : "Non"}`;
        const flips = [p.flipH ? "Flip H" : null, p.flipV ? "Flip V" : null].filter(Boolean);
        if (flips.length) msg += ` — ${flips.join(", ")}`;
        if (p.rotate) msg += ` — Rotation: ${p.rotate}°`;
      });
    }
    if (customText.trim()) {
      msg += `\n✍️ TEXTE PERSONNALISÉ:\n${customText.trim()}`;
      msg += `\nPolice: ${selectedFontName || selectedFont}`;
      msg += `\nCouleur texte: ${textColor}`;
      msg += `\nPosition: ${textPosition}`;
      msg += `\nTaille texte: ${textSize}%`;
    }
    if (note.trim()) msg += `\nMessage atelier: ${note.trim()}`;
    return encodeURIComponent(msg);
  }

  async function handleRequest() {
    setSubmitError("");
    setSubmitting(true);

    // Open the WhatsApp tab synchronously on click (before the await) so
    // browsers don't block it as an unexpected popup; we fill in the
    // destination URL once the request has been saved.
    const waWindow =
      typeof window !== "undefined" ? window.open("", "_blank") : null;

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: name,
          color,
          size,
          qty,
          photoUrl: uploadedPhotos[0]?.url ?? null,
          uploadedPhotos,
          note,
          customText: customText.trim() || null,
          selectedFont,
          textColor,
          textPosition,
          photoSize: uploadedPhotos[0]?.size ?? null,
          textSize,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Impossible d'envoyer la demande.");
        waWindow?.close();
        return;
      }
      setSubmitted(true);

      // Fire-and-forget: also email the atelier a copy of the order.
      // This never blocks the WhatsApp flow — it degrades silently if
      // no email provider is configured.
      fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          color,
          size,
          qty,
          price: product.price * qty,
          uploadedPhotos,
          customText: customText.trim() || null,
          selectedFont,
          textColor,
          textPosition,
          textSize,
          note,
        }),
      }).catch(() => {});

      const waUrl = `https://wa.me/212642999692?text=${buildWhatsAppMessage()}`;
      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }
    } catch {
      setSubmitError("Connexion impossible. Réessayez dans un instant.");
      waWindow?.close();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* NEW FEATURE: shared heart clip-path def (objectBoundingBox so it
          scales to whatever box it's applied to — used by clipPathFor()
          above, in both the live preview and the hidden capture clone). */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id="bt-heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.92 C0.5,0.92 0.08,0.64 0.08,0.35 C0.08,0.17 0.21,0.05 0.37,0.05 C0.45,0.05 0.5,0.1 0.5,0.17 C0.5,0.1 0.55,0.05 0.63,0.05 C0.79,0.05 0.92,0.17 0.92,0.35 C0.92,0.64 0.5,0.92 0.5,0.92 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* NEW FEATURE: crop modal, shown when cropTargetId is set. */}
      {cropTargetPhoto && (
        <PhotoCropModal
          imageUrl={cropTargetPhoto.originalUrl || cropTargetPhoto.url}
          onCancel={() => setCropTargetId(null)}
          onApply={(dataUrl) => handleCropApply(cropTargetPhoto.id, dataUrl)}
          labels={{
            title: "Recadrer la photo",
            cancel: "Annuler",
            apply: "Appliquer",
            applying: "Recadrage...",
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8">
        <nav className="flex items-center gap-1.5 font-inter text-xs text-ink/50">
          <Link href="/" className="hover:text-ink">{t("breadcrumb.home")}</Link>
          <ChevronRight size={12} />
          <Link href="/boutique" className="hover:text-ink">{t("breadcrumb.shop")}</Link>
          <ChevronRight size={12} />
          <span className="text-ink">{name}</span>
        </nav>
      </div>

      {inspirationImage && showInspiration && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-8">
          <div className="flex items-center gap-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <Image src={inspirationImage} alt="" fill className="object-cover" />
            </div>
            <p className="flex-1 font-inter text-sm text-ink/80">
              {t("realisations.inspirationBanner")}
            </p>
            <button
              type="button"
              onClick={() => setShowInspiration(false)}
              className="shrink-0 font-inter text-xs font-semibold text-ink/50 underline hover:text-ink"
            >
              {t("realisations.inspirationDismiss")}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 lg:flex lg:items-start lg:gap-10">
        {/*
          LEFT — preview, sticky so the mug stays visible while controls scroll.

          `position: sticky` can only stay pinned for as long as its own
          containing block (this wrapper's parent, the flex row above) is
          taller than this wrapper's own content — i.e. its "stick budget"
          equals (parent height − this wrapper's height). On desktop the
          RIGHT column caps its own height with `overflow-y-auto`, so the
          row never grows past ~1 viewport and the sticky preview trivially
          holds. Below lg, RIGHT used to be unbounded (grew with every
          control), so the row's total height shot way past this wrapper's
          own ~50vh — once the user scrolled past that point the image
          scrolled away for good and never came back, which is the bug:
          the preview vanished while typing because there was no more
          "stick budget" left. Giving RIGHT the same bounded/scrollable
          treatment below lg (not just lg:) fixes it without touching the
          desktop/tablet (lg:) layout at all.
        */}
        <div className="sticky top-16 z-20 bg-cream pb-2 lg:top-20 lg:w-1/2 lg:shrink-0 lg:bg-transparent lg:pb-0">
          <div
            ref={containerRef}
            className="relative h-[40vh] overflow-hidden rounded-[24px] bg-white shadow-sm sm:h-[50vh] lg:h-[calc(100vh-130px)]"
          >
            <div
              className="absolute inset-0 opacity-70 blur-2xl"
              style={{ background: colorSwatch(color) }}
            />
            {/*
              Plain <img>, not next/image, inside this capture target.
              next/image renders lazy-loaded, srcset-based markup that
              html-to-image (the library used to snapshot this box into the
              cart's "aperçu final") frequently fails to embed — the mug and
              the uploaded photo were coming out blank/white in the captured
              PNG even though they display fine live. A plain <img> with an
              eager, already-resolved src captures reliably.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
              crossOrigin="anonymous"
            />

            {uploadedPhotos.length > 0 && (
              <div className="absolute inset-0 grid place-items-center">
                {uploadedPhotos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(_e, info) =>
                      updatePhotoOffset(photo.id, info.offset.x, info.offset.y)
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative cursor-grab overflow-hidden border-2 border-white shadow-xl active:cursor-grabbing"
                    style={{
                      gridArea: "1 / 1",
                      x: photo.x,
                      y: photo.y,
                      // Direct multiplier of the base size — no extra cap,
                      // so 200% really does render twice as big as 100%.
                      width: `${(PHOTO_BASE_WIDTH_PERCENT * photo.size) / 100}%`,
                      maxWidth: "95%",
                      aspectRatio: "1 / 1",
                      touchAction: "none",
                      // NEW FEATURE: photo shape (clip-path for circle/heart,
                      // borderRadius for square/rounded).
                      clipPath: clipPathFor(photo.shape),
                      borderRadius: borderRadiusFor(photo.shape),
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={t("product.addPhoto")}
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                      crossOrigin="anonymous"
                      // NEW FEATURE: flip horizontal/vertical + rotate.
                      style={{ transform: imgTransformFor(photo) }}
                    />
                    <span className="pointer-events-none absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white">
                      <Move size={11} />
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {customText.trim() && (
              <div
                className="pointer-events-none absolute inset-0 z-20 flex px-[10%] py-[10%]"
                style={{
                  alignItems:
                    textPosition === "top"
                      ? "flex-start"
                      : textPosition === "bottom"
                      ? "flex-end"
                      : "center",
                  justifyContent: "center",
                }}
              >
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragEnd={(_e, info) =>
                    setTextPos((p) => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }))
                  }
                  dir={isArabicText(customText) ? "rtl" : "ltr"}
                  className="pointer-events-auto max-w-full cursor-grab break-words text-center active:cursor-grabbing"
                  style={{
                    x: textPos.x,
                    y: textPos.y,
                    fontFamily: selectedFont,
                    color: textColor,
                    fontSize: `${textSize * 0.18}px`,
                    textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    letterSpacing: textPosition === "around" ? "0.15em" : undefined,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.1,
                  }}
                >
                  {customText}
                </motion.div>
              </div>
            )}

            <span
              className="absolute bottom-3 left-3 rounded-full px-3 py-1 font-inter text-[11px] font-semibold text-ink shadow-sm"
              style={{ background: "rgba(255,255,255,0.9)" }}
            >
              {t("product.previewCaption")} {color || "—"}
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleMultipleUpload}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || uploadedPhotos.length >= MAX_PHOTOS}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60 sm:flex-none"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Camera size={15} />
              )}
              {uploading
                ? t("product.sending")
                : uploadedPhotos.length > 0
                ? t("product.addAnotherPhoto")
                : t("product.addPhoto")}
            </button>
          </div>
          {uploadError && (
            <p className="mt-2 font-inter text-xs text-red-600">{uploadError}</p>
          )}

          {uploadedPhotos.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="font-inter text-xs font-bold">
                📸 {uploadedPhotos.length} {t("product.photosAdded")}
              </p>
              {uploadedPhotos.map((p, idx) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-black/10 bg-white p-2"
                >
                  {/* Row 1: thumbnail, label, size slider, remove — stays
                      horizontal (fits on one line even on mobile). */}
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={p.url} alt="" fill className="object-cover" />
                    </div>
                    <span className="shrink-0 font-inter text-xs text-ink/60">
                      {t("product.photoLabel")} {idx + 1}
                    </span>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      value={p.size}
                      onChange={(e) => updatePhotoSize(p.id, Number(e.target.value))}
                      className="h-1 flex-1 cursor-pointer accent-ink"
                    />
                    <span className="w-10 shrink-0 text-right font-inter text-[10px] text-ink/50">
                      {p.size}%
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label={t("product.remove")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* NEW FEATURE: crop / shape / flip / rotate controls.
                      Stack vertically on mobile, horizontal row from sm:
                      up; every button is touch-friendly (min 44px tall). */}
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setCropTargetId(p.id)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-black/15 px-3 font-inter text-xs font-semibold text-ink/70 hover:bg-black/5"
                    >
                      Recadrer
                    </button>

                    <div className="flex min-h-[44px] items-center justify-center gap-1 rounded-full border border-black/15 px-1">
                      {(["square", "rounded", "circle", "heart"] as PhotoShape[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updatePhotoShape(p.id, s)}
                          aria-label={shapeLabel(s)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-inter text-[10px] font-semibold ${
                            (p.shape ?? "rounded") === s
                              ? "bg-ink text-cream"
                              : "text-ink/60 hover:bg-black/5"
                          }`}
                        >
                          {s === "square" && "▢"}
                          {s === "rounded" && "▢"}
                          {s === "circle" && "●"}
                          {s === "heart" && "♥"}
                        </button>
                      ))}
                    </div>

                    <div className="flex min-h-[44px] items-center justify-center gap-1 rounded-full border border-black/15 px-1">
                      <button
                        type="button"
                        onClick={() => toggleFlip(p.id, "h")}
                        aria-label="Flip horizontal"
                        className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-full font-inter text-[11px] font-semibold ${
                          p.flipH ? "bg-ink text-cream" : "text-ink/60 hover:bg-black/5"
                        }`}
                      >
                        Flip H
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlip(p.id, "v")}
                        aria-label="Flip vertical"
                        className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-full font-inter text-[11px] font-semibold ${
                          p.flipV ? "bg-ink text-cream" : "text-ink/60 hover:bg-black/5"
                        }`}
                      >
                        Flip V
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePhoto(p.id)}
                        aria-label="Rotate 90°"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-inter text-xs font-semibold text-ink/60 hover:bg-black/5"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-2 font-inter text-xs text-ink/50">
            {t("product.previewNote")}
          </p>
        </div>

        {/*
          RIGHT — product details + all controls.
          max-h + overflow-y-auto applies below lg too now (not just lg:) so
          this panel scrolls *within itself* instead of growing the whole
          page past the sticky preview's stick budget (see the comment on
          the LEFT wrapper above) — this is what keeps the mug visible on
          mobile while the customer types. The lg: values are untouched.
        */}
        <div className="mt-4 max-h-[56vh] overflow-y-auto overscroll-contain pr-1 lg:mt-0 lg:w-1/2 lg:max-h-[calc(100vh-100px)] lg:pr-1">
          <h1 className="font-syne text-[28px] font-bold leading-tight md:text-[34px]">
            {name}
          </h1>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Star size={14} className="fill-gold text-gold" />
            <span className="font-inter text-sm text-ink/60">
              {product.rating.toFixed(1)}
              {product.reviews > 0 && ` (${product.reviews})`}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-inter text-xl font-semibold">{product.price} MAD</span>
            {product.compareAt && (
              <span className="font-inter text-sm text-ink/40 line-through">
                {product.compareAt} MAD
              </span>
            )}
          </div>

          <p className="mt-4 font-inter text-[15px] leading-relaxed text-ink/70">
            {desc}
          </p>

          {/* Quantity + add to cart */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-cream2 px-2 py-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="-"
                className="flex h-9 min-h-[36px] w-9 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-ink hover:text-cream"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-inter text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="+"
                className="flex h-9 min-h-[36px] w-9 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-colors hover:bg-ink hover:text-cream"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={generatingPreview}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-5 font-inter text-sm font-semibold transition-colors disabled:opacity-70 sm:flex-none ${
                addedToCart
                  ? "bg-green-600 text-white"
                  : "bg-ink text-cream hover:bg-[#FF2D8A]"
              }`}
            >
              {generatingPreview ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ShoppingBag size={15} />
              )}
              {generatingPreview
                ? t("cart.generatingPreview")
                : addedToCart
                ? t("cart.added")
                : `${t("cart.addToCart")} — ${qty} ${t("cart.itemsCount")}`}
            </button>
          </div>

          {/* Text customization — compact dropdown instead of a big grid */}
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 font-inter text-sm font-bold">
              <Type size={15} />
              {t("text.sectionTitle")}
            </p>

            <label className="mt-3 block font-inter text-xs font-semibold text-ink/70">
              {t("text.label")}
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Let the textarea's default behavior insert a newline —
                  // just make sure Enter never bubbles up and submits
                  // anything else on the page.
                  e.stopPropagation();
                }
              }}
              placeholder={t("text.placeholder")}
              dir={isArabicText(customText) ? "rtl" : "ltr"}
              rows={3}
              className="mt-2 min-h-[80px] w-full resize-none whitespace-pre-wrap rounded-xl border border-black/15 bg-[#F9F5F5] px-3 py-2.5 font-inter text-sm leading-5 focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
            <p className="mt-1 font-inter text-[11px] text-ink/40">
              💡 {t("text.multilineHint")}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-inter text-[11px] font-bold uppercase tracking-widest text-ink/60">
                {t("text.styleLabel")}
              </span>
              <span className="rounded-full bg-cream2 px-2 py-0.5 font-inter text-[11px] font-semibold text-ink/70">
                {selectedFontName}
              </span>
            </div>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white p-3 font-inter text-sm focus:outline-none"
            >
              {FONT_STYLES.map((f) => (
                <option key={f.name} value={f.value} style={{ fontFamily: f.value }}>
                  {f.name} — {(customText || "tarik").replace(/\n/g, " / ")}
                </option>
              ))}
            </select>

            <div className="mt-2 flex items-center gap-2">
              <div
                className="line-clamp-2 flex-1 whitespace-pre-wrap rounded-xl bg-ink px-3 py-2 text-center font-inter text-sm leading-tight text-cream"
                style={{ fontFamily: selectedFont, color: textColor !== "#111111" ? textColor : undefined }}
              >
                {customText || "tarik"}
              </div>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                aria-label={t("text.colorLabel")}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-black/10"
              />
              <select
                value={textPosition}
                onChange={(e) =>
                  changeTextPosition(e.target.value as (typeof TEXT_POSITIONS)[number]["key"])
                }
                className="shrink-0 rounded-xl border border-black/15 bg-white px-3 py-2 font-inter text-xs focus:outline-none"
              >
                {TEXT_POSITIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {t(p.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text size slider (photo sizes are now controlled per-photo above) */}
          <div className="mt-4 rounded-xl bg-[#F9F5F5] p-3">
            <div className="mb-1 flex items-center justify-between font-inter text-[10px] font-bold uppercase tracking-widest text-ink/60">
              <span>{t("text.sizeLabel")}</span>
              <span>{textSize}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={200}
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="h-1 w-full cursor-pointer accent-ink"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-inter text-[10px] text-ink/50">
                <Move size={11} />
                {t("text.dragHint")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTextSize(100);
                  setTextPos({ x: 0, y: 0 });
                }}
                className="shrink-0 rounded-full border border-black/10 bg-white px-2.5 py-0.5 font-inter text-[10px] font-semibold"
              >
                {t("text.sizeReset")}
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="mt-6">
            <p className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
              {t("product.color")} : <span className="text-ink">{color}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    color === c
                      ? "scale-110 border-ink"
                      : "border-black/10 hover:scale-105"
                  }`}
                  style={{ background: colorSwatch(c) }}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          {product.sizes && (
            <div className="mt-6">
              <p className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
                {t("product.size")} : <span className="text-ink">{size}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`rounded-full border px-4 py-2 font-inter text-sm font-medium ${
                      size === s
                        ? "border-ink bg-ink text-cream"
                        : "border-black/15 bg-white hover:border-black/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="mt-6">
            <label className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
              {t("product.noteLabel")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("product.notePlaceholder")}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
          </div>

          {/* Request button */}
          <div className="mt-7 border-t border-black/10 pt-6">
            {submitted ? (
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-5 py-3 font-inter text-sm font-semibold text-green-700">
                <Check size={16} className="shrink-0" />
                {t("text.sentToast")}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequest}
                disabled={submitting}
                className="min-h-[44px] w-full rounded-full bg-ink py-3.5 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60 md:w-fit md:px-8"
              >
                {submitting ? t("reviews.sending") : t("product.sendRequest")}
              </button>
            )}

            {submitError && (
              <p className="mt-2 font-inter text-xs text-red-600">{submitError}</p>
            )}

            <a
              href={`https://wa.me/212642999692?text=${buildWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 font-inter text-sm font-medium text-ink/60 hover:text-ink"
            >
              <MessageCircle size={15} />
              {t("product.orWhatsapp")}
            </a>

            <p className="mt-3 font-inter text-xs text-ink/50">
              {t("product.confirmNote")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
