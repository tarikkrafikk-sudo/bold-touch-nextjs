import { NextRequest, NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/save-upload";

// Public endpoint: a customer uploads their own photo to personalize a product.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
  }

  const result = await saveUploadedImage(file, "customers");
  if ("error" in result) {
    const isConfigError = result.error.startsWith("BLOB_READ_WRITE_TOKEN");
    return NextResponse.json(
      { error: result.error },
      { status: isConfigError ? 500 : 400 }
    );
  }

  return NextResponse.json({ url: result.url, publicUrl: result.url, success: true });
}
