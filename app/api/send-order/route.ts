import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Reads the "OWNER_EMAIL" environment variable on Vercel so the owner can
// change the notification address from Settings → Environment Variables
// without editing code. Falls back to the current address if that variable
// isn't set.
const ORDER_EMAIL = process.env.OWNER_EMAIL || "tarikk.rafikk@gmail.com";

interface OrderPhoto {
  id?: string;
  url: string;
  x?: number;
  y?: number;
  size?: number;
}

interface CartLine {
  name?: string;
  color?: string | null;
  size?: string | null;
  qty?: number;
  price?: number;
  finalPreview?: string | null;
  uploadedPhotos?: OrderPhoto[];
  // Legacy single-photo fields, still read for carts saved before the
  // multi-photo update.
  uploadedPhotoUrl?: string | null;
  photoSize?: number | null;
  photoPos?: { x: number; y: number } | null;
  customText?: string | null;
  selectedFont?: string | null;
  selectedFontName?: string | null;
  textColor?: string | null;
  textPosition?: string | null;
  textSize?: number | null;
}

type Attachment = { filename: string; content: string };

function absolutize(origin: string, url: string) {
  return url.startsWith("http") ? url : `${origin}${url}`;
}

// Plain HTML collapses newlines — convert them to <br/> so a multi-line
// customization text (e.g. "tarik\nrafik") still shows on two lines in
// the email, matching what the customer typed and what prints on mug/preview.
function nl2br(text: string) {
  return text.replace(/\n/g, "<br/>");
}

// Resend's base64 attachments shouldn't blow past a few MB total, so we cap
// how many files we attach per order — anything past the cap (or a single
// client photo over 10MB, or a failed fetch) falls back to a link so the
// atelier can still reach the photo.
const MAX_ATTACHMENTS = 30;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB per client photo, as requested.

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
  "image/avif": "avif",
};

function extFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const clean = contentType.split(";")[0].trim().toLowerCase();
  return MIME_TO_EXT[clean] ?? null;
}

function extFromUrl(url: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(url);
  const ext = match?.[1]?.toLowerCase();
  return ext && ext.length <= 5 ? ext : "jpg";
}

function dataUrlToAttachment(dataUrl: string, filename: string): Attachment | null {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { filename, content: match[2] };
}

// Fetches a customer photo from its Vercel Blob URL and returns it ready to
// attach to the email, preserving its original format (jpg/png/webp/heic/…)
// at full quality — no re-encoding, no compression. Returns null (caller
// falls back to a link) if the file is missing, unreachable, or over the
// 10MB cap.
async function fetchPhotoAttachment(
  url: string,
  filenameBase: string
): Promise<Attachment | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_PHOTO_BYTES) return null;
    const ext = extFromContentType(contentType) ?? extFromUrl(url);
    return { filename: `${filenameBase}.${ext}`, content: buf.toString("base64") };
  } catch (err) {
    console.error("Client photo fetch failed:", url, err);
    return null;
  }
}

// Builds the HTML block for a set of uploaded photos, attaching each one as
// a real HD file (preferred) and only falling back to a link when the
// attachment cap is hit or the fetch/convert failed for that one photo.
async function photosBlockAndAttach(
  origin: string,
  photos: OrderPhoto[] | undefined,
  label: string,
  attachments: Attachment[]
): Promise<string> {
  if (!photos || photos.length === 0) return "";

  const items: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const url = absolutize(origin, p.url);
    const meta = `taille : ${p.size ?? 100}%${
      p.x !== undefined && p.y !== undefined ? ` — position x:${Math.round(p.x)} y:${Math.round(p.y)}` : ""
    }`;

    if (attachments.length >= MAX_ATTACHMENTS) {
      items.push(`<li>${i + 1}. ⚠️ Limite de pièces jointes atteinte — lien : <a href="${url}">${url}</a> — ${meta}</li>`);
      continue;
    }

    const att = await fetchPhotoAttachment(url, `${label}-photo-${i + 1}-HD`);
    if (att) {
      attachments.push(att);
      items.push(`<li>${i + 1}. 📎 Pièce jointe : <strong>${att.filename}</strong> — ${meta}</li>`);
    } else {
      items.push(`<li>${i + 1}. ⚠️ Pièce jointe impossible (fichier trop lourd ou inaccessible) — lien : <a href="${url}">${url}</a> — ${meta}</li>`);
    }
  }

  const n = photos.length;
  return `<p>📸 ${n} PHOTO(S) CLIENT HD EN PIÈCE${n > 1 ? "S" : ""} JOINTE${n > 1 ? "S" : ""} :</p><ul style="margin:4px 0 0 18px;padding:0;">${items.join("")}</ul>`;
}

async function lineHtml(
  origin: string,
  l: CartLine,
  attachmentFilename: string | null,
  attachments: Attachment[],
  label: string
): Promise<string> {
  const legacyPhotoUrl = l.uploadedPhotoUrl ? absolutize(origin, l.uploadedPhotoUrl) : "";

  let photosBlock = "";
  if (l.uploadedPhotos && l.uploadedPhotos.length > 0) {
    photosBlock = await photosBlockAndAttach(origin, l.uploadedPhotos, label, attachments);
  } else if (legacyPhotoUrl) {
    const meta = `taille : ${l.photoSize ?? 100}%${
      l.photoPos ? ` — position x:${Math.round(l.photoPos.x)} y:${Math.round(l.photoPos.y)}` : ""
    }`;
    if (attachments.length < MAX_ATTACHMENTS) {
      const att = await fetchPhotoAttachment(legacyPhotoUrl, `${label}-photo-HD`);
      photosBlock = att
        ? (attachments.push(att),
          `<p>📸 PHOTO CLIENT HD EN PIÈCE JOINTE : <strong>${att.filename}</strong> — ${meta}</p>`)
        : `<p>⚠️ Pièce jointe impossible — lien : <a href="${legacyPhotoUrl}">${legacyPhotoUrl}</a> — ${meta}</p>`;
    } else {
      photosBlock = `<p>⚠️ Limite de pièces jointes atteinte — lien : <a href="${legacyPhotoUrl}">${legacyPhotoUrl}</a> — ${meta}</p>`;
    }
  }

  return `
    <p><strong>${l.name ?? ""}</strong> ${l.color ? `— ${l.color}` : ""} ${l.size ? `— ${l.size}` : ""} — Qty ${l.qty ?? 1} — ${l.price ? l.price * (l.qty ?? 1) : ""} MAD</p>
    ${
      attachmentFilename
        ? `<p>🖼️ Aperçu final en pièce jointe : <strong>${attachmentFilename}</strong></p>`
        : ""
    }
    ${photosBlock}
    ${
      l.customText
        ? `<p>✍️ ${nl2br(l.customText)} (police : ${l.selectedFontName ?? l.selectedFont ?? "—"}, couleur : ${l.textColor ?? "—"}, position : ${l.textPosition ?? "—"}, taille : ${l.textSize ?? 100}%)</p>`
        : ""
    }
    <hr style="border:none;border-top:1px solid #eee;margin:10px 0;" />
  `;
}

// Public endpoint: emails the atelier a copy of a customer's order/request.
// Accepts either a single product payload (from the product page's "Envoyer
// ma demande") or a full cart payload (from the /panier checkout).
// Best-effort — if no RESEND_API_KEY is configured, this silently no-ops
// rather than failing the request (WhatsApp remains the primary channel).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured — WhatsApp already carries the order,
    // so we just acknowledge without erroring the client flow.
    console.error("RESEND_API_KEY missing — order email skipped.");
    return NextResponse.json({ ok: true, emailed: false });
  }

  const origin = req.nextUrl.origin;
  const cart = Array.isArray(body.cart) ? (body.cart as CartLine[]) : null;

  let subject: string;
  let html: string;
  const attachments: Attachment[] = [];

  if (cart && cart.length > 0) {
    subject = `Nouvelle commande BOLD TOUCH (${cart.length} article${cart.length > 1 ? "s" : ""})`;
    const lines = await Promise.all(
      cart.map(async (l, i) => {
        let filename: string | null = null;
        if (l.finalPreview && attachments.length < MAX_ATTACHMENTS) {
          filename = `apercu-final-${i + 1}.png`;
          const att = dataUrlToAttachment(l.finalPreview, filename);
          if (att) attachments.push(att);
          else filename = null;
        }
        return lineHtml(origin, l, filename, attachments, `article-${i + 1}`);
      })
    );
    html = `
      <h2>Nouvelle commande BOLD TOUCH</h2>
      ${lines.join("")}
      ${body.total ? `<p><strong>Total :</strong> ${body.total} MAD</p>` : ""}
    `;
  } else {
    const {
      productName,
      color,
      size,
      qty,
      price,
      photoUrl,
      customText,
      selectedFont,
      textColor,
      textPosition,
      photoSize,
      textSize,
      clientName,
      clientPhone,
      note,
    } = body as Record<string, string | number | null | undefined>;

    const uploadedPhotos = Array.isArray(body.uploadedPhotos)
      ? (body.uploadedPhotos as OrderPhoto[])
      : [];

    let photosBlock = "";
    if (uploadedPhotos.length > 0) {
      photosBlock = await photosBlockAndAttach(origin, uploadedPhotos, "demande", attachments);
    } else if (photoUrl) {
      const absolutePhotoUrl = absolutize(origin, String(photoUrl));
      const meta = `taille : ${photoSize ?? 100}%`;
      if (attachments.length < MAX_ATTACHMENTS) {
        const att = await fetchPhotoAttachment(absolutePhotoUrl, "demande-photo-HD");
        photosBlock = att
          ? (attachments.push(att),
            `<p>📸 PHOTO CLIENT HD EN PIÈCE JOINTE : <strong>${att.filename}</strong> — ${meta}</p>`)
          : `<p>⚠️ Pièce jointe impossible — lien : <a href="${absolutePhotoUrl}">${absolutePhotoUrl}</a> — ${meta}</p>`;
      } else {
        photosBlock = `<p>⚠️ Limite de pièces jointes atteinte — lien : <a href="${absolutePhotoUrl}">${absolutePhotoUrl}</a> — ${meta}</p>`;
      }
    }

    subject = `Nouvelle commande ${productName ?? ""}${clientName ? ` - ${clientName}` : ""}`;
    html = `
      <h2>Nouvelle commande — ${productName ?? ""}</h2>
      <p><strong>Produit :</strong> ${productName ?? ""} ${color ? `— ${color}` : ""} ${size ? `— ${size}` : ""}</p>
      <p><strong>Quantité :</strong> ${qty ?? 1}</p>
      ${price ? `<p><strong>Prix :</strong> ${price} MAD</p>` : ""}
      ${photosBlock}
      ${customText ? `<p><strong>Texte personnalisé :</strong> ${nl2br(String(customText))} (police : ${selectedFont ?? "—"}, couleur : ${textColor ?? "—"}, position : ${textPosition ?? "—"}, taille : ${textSize ?? 100}%)</p>` : ""}
      ${note ? `<p><strong>Message atelier :</strong> ${note}</p>` : ""}
      ${clientName || clientPhone ? `<p><strong>Client :</strong> ${clientName ?? ""} ${clientPhone ?? ""}</p>` : ""}
    `;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "Bold Touch <onboarding@resend.dev>",
      to: ORDER_EMAIL,
      subject,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    console.log("Order email sent:", JSON.stringify(result));
    return NextResponse.json({ ok: true, emailed: true });
  } catch (err) {
    console.error("send-order email failed:", err);
    // Don't block the customer's flow over an email delivery failure.
    return NextResponse.json({ ok: true, emailed: false });
  }
}
