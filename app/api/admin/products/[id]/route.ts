import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { deleteProduct, getProducts, updateProduct } from "@/lib/products-store";
import { saveUploadedImage } from "@/lib/save-upload";
import type { Badge, Category, Product } from "@/lib/products";

const VALID_CATEGORIES: Category[] = [
  "mugs",
  "verres",
  "tshirts",
  "coussins",
  "accessoires",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const existing = getProducts().find((p) => p.id === params.id);
  if (!existing) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
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

  const patch: Partial<Product> = {};

  if (name) patch.name = { ...existing.name, fr: name };

  if (priceRaw) {
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
    }
    patch.price = price;
  }

  if (catRaw && VALID_CATEGORIES.includes(catRaw as Category)) {
    patch.cat = catRaw as Category;
  }

  if (colorsRaw) {
    const colors = colorsRaw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (colors.length) patch.colors = colors;
  }

  if (sizesRaw.trim()) {
    const sizes = sizesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    patch.sizes = sizes.length ? sizes : null;
  }

  if (badgeRaw) {
    if (badgeRaw === "none") {
      patch.badge = null;
    } else if (["bestseller", "new", "gift"].includes(badgeRaw)) {
      patch.badge = badgeRaw as Badge;
    }
  }

  if (desc) patch.desc = { ...existing.desc, fr: desc };

  if (file instanceof File && file.size > 0) {
    const result = await saveUploadedImage(file, "products");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    patch.image = result.url;
  }

  const products = updateProduct(params.id, patch);
  return NextResponse.json({ products });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const products = deleteProduct(params.id);
  return NextResponse.json({ products });
}
