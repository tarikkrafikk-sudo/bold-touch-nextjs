"use client";

// NEW FEATURE: photo cropping modal (react-easy-crop). Lets the customer
// crop their uploaded photo before it's placed on the product. The crop is
// rasterized client-side onto a canvas, uploaded to Vercel Blob like any
// other customer photo, and the resulting URL replaces the photo's `url`
// (the original upload is kept separately as `originalUrl` so "Recadrer"
// can always restart from the untouched source).

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Loader2, X } from "lucide-react";

interface PhotoCropModalProps {
  imageUrl: string;
  aspect?: number;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
  labels: {
    title: string;
    cancel: string;
    apply: string;
    applying: string;
  };
}

// Loads the source image and draws only the cropped rectangle onto a
// canvas, returning a PNG data URL — the standard react-easy-crop recipe.
async function getCroppedImage(imageUrl: string, cropPixels: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return canvas.toDataURL("image/png", 0.95);
}

export default function PhotoCropModal({
  imageUrl,
  aspect = 1,
  onCancel,
  onApply,
  labels,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    setError("");
    try {
      const dataUrl = await getCroppedImage(imageUrl, croppedAreaPixels);
      onApply(dataUrl);
    } catch (err) {
      console.error("Crop failed:", err);
      setError("Recadrage impossible. Réessayez.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <p className="font-inter text-sm font-bold">{labels.title}</p>
          <button
            type="button"
            onClick={onCancel}
            aria-label={labels.cancel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink/60 hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[55vh] w-full bg-black sm:h-[420px]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3 px-5 py-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-ink"
            aria-label="Zoom"
          />
          {error && <p className="font-inter text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] flex-1 rounded-full border border-black/15 font-inter text-sm font-semibold text-ink/70 hover:bg-black/5"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || !croppedAreaPixels}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-ink font-inter text-sm font-semibold text-cream disabled:opacity-60"
            >
              {applying && <Loader2 size={15} className="animate-spin" />}
              {applying ? labels.applying : labels.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
