import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { addRequest, getRequests, type RequestPhoto } from "@/lib/requests-store";

// Admin: list all customer requests.
export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json({ requests: await getRequests() });
}

// Public: a customer submits a customization request from the product page.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const productId = String(body.productId || "").trim();
  const productName = String(body.productName || "").trim();

  if (!productId || !productName) {
    return NextResponse.json(
      { error: "Produit manquant." },
      { status: 400 }
    );
  }

  const note = String(body.note || "").trim().slice(0, 500);
  const qty = Number(body.qty) > 0 ? Math.floor(Number(body.qty)) : 1;

  const uploadedPhotos: RequestPhoto[] = Array.isArray(body.uploadedPhotos)
    ? (body.uploadedPhotos as unknown[])
        .filter(
          (p): p is RequestPhoto =>
            !!p && typeof p === "object" && typeof (p as RequestPhoto).url === "string"
        )
        .slice(0, 5)
    : [];

  const request = {
    id: `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    productName,
    color: body.color ? String(body.color) : null,
    size: body.size ? String(body.size) : null,
    qty,
    photoUrl: body.photoUrl ? String(body.photoUrl) : null,
    uploadedPhotos,
    note,
    customText: body.customText ? String(body.customText).slice(0, 200) : null,
    selectedFont: body.selectedFont ? String(body.selectedFont) : null,
    textColor: body.textColor ? String(body.textColor) : null,
    textPosition: body.textPosition ? String(body.textPosition) : null,
    photoSize: Number.isFinite(Number(body.photoSize)) ? Number(body.photoSize) : null,
    textSize: Number.isFinite(Number(body.textSize)) ? Number(body.textSize) : null,
    createdAt: new Date().toISOString(),
  };

  try {
    await addRequest(request);
  } catch (err) {
    console.error("Failed to persist request:", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la demande. Réessayez." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
