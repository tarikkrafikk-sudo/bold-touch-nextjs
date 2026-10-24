import { NextRequest, NextResponse } from "next/server";
import { addReview, getApprovedReviews } from "@/lib/reviews-store";

// Public: list approved reviews for display on the homepage.
export async function GET() {
  return NextResponse.json({ reviews: getApprovedReviews() });
}

// Public: a customer submits a review. Goes to "pending" until an admin
// approves it — it will not appear on the site until then.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 80);
  const comment = String(body.comment || "").trim().slice(0, 600);
  const productName = body.productName ? String(body.productName).slice(0, 120) : null;
  const ratingRaw = Number(body.rating);
  const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5;

  if (!name || !comment) {
    return NextResponse.json(
      { error: "Nom et commentaire requis." },
      { status: 400 }
    );
  }

  const review = {
    id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    rating,
    comment,
    productName,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  addReview(review);
  return NextResponse.json({ ok: true });
}
