import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getReviews } from "@/lib/reviews-store";

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json({ reviews: await getReviews() });
}
