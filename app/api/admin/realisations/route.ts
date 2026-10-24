import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { addRealisation, getRealisations } from "@/lib/realisations-store";
import { saveUploadedImage } from "@/lib/save-upload";
import { slugify } from "@/lib/products-store";
import type { Category } from "@/lib/products";
import type { Realisation } from "@/data/realisations";

const VALID_CATEGORIES: Category[] = [
  "mugs",
  "verres",
  "tshirts",
  "coussins",
  "accessoires",
];

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json({ realisations: getRealisations() });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const form = await req.formData();
  const product = String(form.get("product") || "").trim();
  const client = String(form.get("client") || "").trim();
  const catRaw = String(form.get("cat") || "");
  const file = form.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Une photo est requise." }, { status: 400 });
  }
  if (!product) {
    return NextResponse.json({ error: "Le nom du modèle est requis." }, { status: 400 });
  }
  const cat = VALID_CATEGORIES.includes(catRaw as Category)
    ? (catRaw as Category)
    : "accessoires";

  const result = await saveUploadedImage(file, "realisations");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const realisation: Realisation = {
    id: `${slugify(product)}-${Date.now().toString(36)}`,
    image: result.url,
    product,
    client: client || "Commande client",
    date: String(new Date().getFullYear()),
    cat,
  };

  const realisations = addRealisation(realisation);
  return NextResponse.json({ realisations });
}
