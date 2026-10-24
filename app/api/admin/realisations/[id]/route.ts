import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { deleteRealisation } from "@/lib/realisations-store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const realisations = deleteRealisation(params.id);
  return NextResponse.json({ realisations });
}
