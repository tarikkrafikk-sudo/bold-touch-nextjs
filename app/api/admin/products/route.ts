import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { addProduct, getProducts, slugify } from "@/lib/products-store";
import { saveUploadedImage } from "@/lib/save-upload";
import type { Badge, Category, Product } from "@/lib/products";

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
  return NextResponse.json({ products: getProducts() });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const priceRaw = String(form.get("price") || "");
  const catRaw = String(form.get("cat") || "");
  const colorsRaw = String(form.get("colors") || "");
  const sizesRaw = String(form.get("sizes") || "");
  const badgeRaw = String(form.get("badge") || "");
  const desc = String(form.get("desc") || "").trim();
  const file = form.get("image");

  if (!name) {
    return NextResponse.json({ error: "Le nom du produit est requis." }, { status: 400 });
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  }
  const cat = VALID_CATEGORIES.includes(catRaw as Category)
    ? (catRaw as Category)
    : "accessoires";

  let image = "/assets/badge-circle.png";
  if (file instanceof File && file.size > 0) {
    const result = await saveUploadedImage(file, "products");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    image = result.url;
  }

  const colors = colorsRaw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const sizes = sizesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const badge: Badge = ["bestseller", "new", "gift"].includes(badgeRaw)
    ? (badgeRaw as Badge)
    : null;

  const product: Product = {
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    cat,
    price,
    compareAt: null,
    image,
    colors: colors.length ? colors : ["Ivoire"],
    sizes: sizes.length ? sizes : null,
    badge,
    rating: 5,
    reviews: 0,
    name: { fr: name },
    desc: { fr: desc || "Pièce personnalisable BOLD TOUCH, fabriquée à la commande." },
  };

  const products = addProduct(product);
  return NextResponse.json({ products });
}
