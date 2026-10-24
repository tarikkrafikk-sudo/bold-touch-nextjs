import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// All uploaded images (customer personalization photos and admin product
// photos) go to Vercel Blob so every generated link is a real public
// https:// URL — never http://localhost, which is dead outside the
// developer's own machine (can't be opened from WhatsApp on a phone, can't
// be downloaded by the atelier for printing). This requires
// BLOB_READ_WRITE_TOKEN to be set, even when running locally — see
// .env.example for how to get one.
export async function saveUploadedImage(
  file: File,
  subfolder: "products" | "customers" | "realisations"
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté. Utilisez JPG, PNG, WEBP ou GIF." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Image trop lourde (5 Mo maximum)." };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "BLOB_READ_WRITE_TOKEN manquant. Va sur vercel.com > Storage > Create Blob Store et ajoute le token dans .env.local, puis relance le serveur.",
    };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(`boldtouch/${subfolder}/${safeName}`, file, {
      access: "public",
    });
    // blob.url is always a real https://...public.blob.vercel-storage.com/...
    // link — works from WhatsApp, a phone browser, or the atelier, unlike a
    // localhost path.
    return { url: blob.url };
  } catch (err) {
    console.error("Vercel Blob upload failed:", err);
    return { error: "Envoi impossible. Vérifiez votre BLOB_READ_WRITE_TOKEN." };
  }
}
