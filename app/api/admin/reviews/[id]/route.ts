import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { deleteReview, setReviewStatus } from "@/lib/reviews-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const reviews = setReviewStatus(params.id, body.status);
  return NextResponse.json({ reviews });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const reviews = deleteReview(params.id);
  return NextResponse.json({ reviews });
}
