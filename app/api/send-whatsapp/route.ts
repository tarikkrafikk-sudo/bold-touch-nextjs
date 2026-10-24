import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// WhatsApp Cloud API (Meta Graph API) — pushes the owner, straight to
// OWNER_WHATSAPP_NUMBER with zero tap needed from the customer:
//   1. every customer photo, as a real inline WhatsApp image (not a text
//      link) — sent via `image.link` straight from its public Vercel Blob
//      URL when it's a jpg/png (Meta's "image" type only accepts those two
//      formats), or as a document otherwise (webp/gif);
//   2. the generated final-preview composite, also as an inline image;
//   3. one text message with the full order details, sent last.
// If anything about the Cloud API isn't usable right now (no token
// configured, bad token, or Meta's 24-hour customer-service-window
// restriction), this route reports `sent: false` and the frontend falls
// back to the original wa.me tab — so checkout never breaks either way.
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1427810060409394";
const OWNER_WHATSAPP_NUMBER = process.env.OWNER_WHATSAPP_NUMBER; // e.g. "2126XXXXXXXX" — digits only, no "+".

const GRAPH_VERSION = "v20.0";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB per file.
const MAX_FILES = 6; // up to 5 customer photos + 1 final preview per order.
const SEND_DELAY_MS = 500; // throttle between Cloud API calls so we don't hit rate limits.

type PhotoShape = "square" | "rounded" | "circle" | "heart";

interface OrderPhoto {
  id?: string;
  url: string;
  x?: number;
  y?: number;
  size?: number;
  shape?: PhotoShape;
}

interface CartLine {
  name?: string;
  color?: string | null;
  size?: string | null;
  qty?: number;
  price?: number;
  finalPreview?: string | null;
  uploadedPhotos?: OrderPhoto[];
  uploadedPhotoUrl?: string | null;
  customText?: string | null;
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

function absolutize(origin: string, url: string) {
  return url.startsWith("http") ? url : `${origin}${url}`;
}

function extFromUrl(url: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(url);
  return match?.[1]?.toLowerCase() ?? "";
}

// Meta's "image" message type only accepts jpeg/png — anything else
// (webp, gif) has to go as a "document" instead.
function isDirectImageExt(ext: string) {
  return ext === "jpg" || ext === "jpeg" || ext === "png";
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

function slug(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "produit";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Node's Buffer isn't directly a BlobPart in the TS lib types used here —
// copy it into a plain Uint8Array first.
function toBlob(buffer: Buffer, mime: string): Blob {
  return new Blob([new Uint8Array(buffer)], { type: mime });
}

async function graphSend(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", to: OWNER_WHATSAPP_NUMBER, ...payload }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const code = data?.error?.code;
      if (code === 131047) {
        console.error(
          "WhatsApp 24h window closed (code 131047) — owner hasn't messaged the business number recently enough."
        );
      } else {
        console.error("WhatsApp send failed:", data);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return false;
  }
}

// Sends an image straight from its public Vercel Blob URL — no fetch/upload
// round-trip needed, Meta fetches the link itself. Only valid for jpg/png.
async function sendImageByLink(link: string, caption: string): Promise<boolean> {
  return graphSend({ type: "image", image: { link, caption } });
}

// Step 1 of the upload flow (used for the final preview, which is a local
// data: URL with no public link, and for non-jpg/png photos sent as
// documents): upload the file's bytes and get back a short-lived media id.
async function uploadMediaToWhatsApp(
  buffer: Buffer,
  mime: string,
  filename: string
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mime);
    form.append("file", toBlob(buffer, mime), filename);

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
        body: form,
      }
    );
    const data = await res.json();
    if (!res.ok || !data.id) {
      console.error("WhatsApp media upload failed:", data);
      return null;
    }
    return data.id as string;
  } catch (err) {
    console.error("WhatsApp media upload error:", err);
    return null;
  }
}

async function sendImageById(mediaId: string, caption: string): Promise<boolean> {
  return graphSend({ type: "image", image: { id: mediaId, caption } });
}

async function sendDocumentById(mediaId: string, filename: string, caption: string): Promise<boolean> {
  return graphSend({ type: "document", document: { id: mediaId, filename, caption } });
}

async function sendText(body: string): Promise<boolean> {
  return graphSend({ type: "text", text: { body } });
}

// Sends one customer photo: as a direct inline image (link method) when
// it's jpg/png, or fetched + uploaded as a document for other formats
// (webp/gif — Vercel Blob is the only source, so a HEAD isn't needed, the
// stored extension always matches the real type, see lib/save-upload.ts).
async function sendCustomerPhoto(url: string, filenameBase: string, caption: string): Promise<boolean> {
  const ext = extFromUrl(url);
  if (isDirectImageExt(ext)) {
    return sendImageByLink(url, caption);
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_PHOTO_BYTES) return false;
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
    const mediaId = await uploadMediaToWhatsApp(buf, mime, `${filenameBase}.${ext || "bin"}`);
    if (!mediaId) return false;
    return sendDocumentById(mediaId, `${filenameBase}.${ext || "bin"}`, caption);
  } catch (err) {
    console.error("sendCustomerPhoto fallback failed:", url, err);
    return false;
  }
}

// Public endpoint, called from /panier right after checkout, in parallel
// with /api/send-order (Gmail). Always returns 200 — the frontend reads
// `sent` to decide whether it still needs to open the wa.me fallback tab.
export async function POST(req: NextRequest) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !OWNER_WHATSAPP_NUMBER) {
    console.error(
      "WhatsApp Cloud API not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID / OWNER_WHATSAPP_NUMBER) — falling back to wa.me."
    );
    return NextResponse.json({ ok: true, sent: false, reason: "not_configured" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const cart = Array.isArray(body.cart) ? (body.cart as CartLine[]) : [];
  const total = body.total;

  let filesSent = 0;

  // 1. Every customer photo + the final preview, one by one, each with a
  // caption carrying the product name, size %, position, shape and custom
  // text — throttled so we don't hammer the Graph API.
  for (let i = 0; i < cart.length; i++) {
    const l = cart[i];
    const label = `ARTICLE-${i + 1}-${slug(l.name ?? "produit")}`;

    const photos =
      l.uploadedPhotos && l.uploadedPhotos.length > 0
        ? l.uploadedPhotos
        : l.uploadedPhotoUrl
        ? [{ url: l.uploadedPhotoUrl } as OrderPhoto]
        : [];

    for (let p = 0; p < photos.length && filesSent < MAX_FILES; p++) {
      const photo = photos[p];
      const url = absolutize(origin, photo.url);
      const caption = [
        `📸 PHOTO CLIENT HD — Commande Bold Touch`,
        `Produit: ${l.name ?? ""}`,
        photo.size !== undefined ? `Taille: ${photo.size}%` : null,
        photo.x !== undefined && photo.y !== undefined
          ? `Position x:${Math.round(photo.x)} y:${Math.round(photo.y)}`
          : null,
        `Forme: ${shapeLabel(photo.shape)}`,
        l.customText ? `Texte: "${l.customText}"` : null,
      ]
        .filter(Boolean)
        .join(" — ");

      const ok = await sendCustomerPhoto(url, `${label}-PHOTO-${p + 1}-HD`, caption);
      if (ok) filesSent++;
      await delay(SEND_DELAY_MS);
    }

    if (l.finalPreview && filesSent < MAX_FILES) {
      const parsed = dataUrlToBuffer(l.finalPreview);
      if (parsed) {
        const filename = `${label}-APERCU-FINAL.png`;
        const mediaId = await uploadMediaToWhatsApp(parsed.buffer, parsed.mime, filename);
        if (mediaId) {
          const ok = await sendImageById(mediaId, `🖼️ Aperçu final — ${l.name ?? ""}`);
          if (ok) filesSent++;
        }
      }
      await delay(SEND_DELAY_MS);
    }
  }

  // 2. The full order summary, as text, sent last.
  let summary = `🛒 COMMANDE BOLD TOUCH`;
  cart.forEach((l, i) => {
    summary += `\n\n${i + 1}. ${l.name ?? ""} ${[l.color, l.size].filter(Boolean).join(" - ")} x${l.qty ?? 1}${
      l.price ? ` — ${l.price * (l.qty ?? 1)} MAD` : ""
    }`;
    if (l.customText) summary += `\n   ✍️ ${l.customText}`;
  });
  if (total) summary += `\n\nTotal: ${total} MAD`;
  const textOk = await sendText(summary);

  // The owner got notified if any single send went through — files are
  // best-effort, the text is the safety net, either counts.
  const sent = filesSent > 0 || textOk;
  return NextResponse.json({ ok: true, sent, filesSent, textOk });
}
