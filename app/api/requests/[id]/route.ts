import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { deleteRequest } from "@/lib/requests-store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const requests = await deleteRequest(params.id);
  return NextResponse.json({ requests });
}
