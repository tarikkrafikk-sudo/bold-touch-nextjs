"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, X, Camera, Loader2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  productName: string | null;
  photos?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const MAX_REVIEW_PHOTOS = 5;

export default function ReviewsSection() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; preview: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (files.length === 0) return;

    const room = MAX_REVIEW_PHOTOS - photos.length;
    const toUpload = files.slice(0, Math.max(0, room));
    if (toUpload.length === 0) return;

    setUploadingPhoto(true);
    setError("");
    for (const file of toUpload) {
      const preview = URL.createObjectURL(file);
      try {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("subfolder", "reviews");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) {
          setError(data.error || "Envoi de la photo impossible.");
          continue;
        }
        setPhotos((prev) => [...prev, { url: data.url, preview }]);
      } catch {
        setError("Envoi de la photo impossible.");
      }
    }
    setUploadingPhoto(false);
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment, photos: photos.map((p) => p.url) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setSent(true);
      setName("");
      setComment("");
      setRating(5);
      setPhotos([]);
      setTimeout(() => {
        setShowForm(false);
        setSent(false);
      }, 2500);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {t("reviews.subtitle")}
          </p>
          <h2 className="font-syne text-[28px] font-bold leading-tight md:text-[36px]">
            {t("reviews.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full border border-ink/15 bg-white px-5 py-2.5 font-inter text-sm font-semibold text-ink transition-colors hover:border-ink/30"
        >
          {t("reviews.leaveReview")}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-6 rounded-2xl border border-black/10 bg-white p-6"
        >
          <button
            type="button"
            onClick={() => setShowForm(false)}
            aria-label={t("reviews.cancel")}
            className="absolute right-4 top-4 rounded-full p-1.5 text-ink/50 hover:bg-black/5"
          >
            <X size={16} />
          </button>

          {sent ? (
            <p className="py-6 text-center font-inter text-sm font-semibold text-green-700">
              {t("reviews.pendingThanks")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
                    {t("reviews.name")}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                    className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                  />
                </div>
                <div>
                  <label className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
                    {t("reviews.rating")}
                  </label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star`}
                        className="p-0.5"
                      >
                        <Star
                          size={22}
                          className={n <= rating ? "fill-gold text-gold" : "text-ink/20"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
                  {t("reviews.comment")}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  maxLength={500}
                  placeholder={t("reviews.commentPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                />
              </div>

              <div>
                <label className="font-inter text-xs font-semibold uppercase tracking-wide text-ink/60">
                  {t("reviews.photos")}
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {photos.map((p) => (
                    <div key={p.url} className="relative h-16 w-16 overflow-hidden rounded-xl border border-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.url)}
                        aria-label={t("reviews.removePhoto")}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_REVIEW_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/25 text-ink/50 hover:border-black/40 disabled:opacity-60"
                    >
                      {uploadingPhoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                      <span className="font-inter text-[10px]">{photos.length}/{MAX_REVIEW_PHOTOS}</span>
                    </button>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>

              {error && <p className="font-inter text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-ink px-6 py-2.5 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? t("reviews.sending") : t("reviews.submit")}
              </button>
            </form>
          )}
        </motion.div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {reviews.length === 0 && (
          <p className="font-inter text-sm text-ink/60">{t("reviews.empty")}</p>
        )}
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
            className="rounded-2xl border border-black/10 bg-white p-6"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  className={idx < r.rating ? "fill-gold text-gold" : "text-ink/15"}
                />
              ))}
            </div>
            <p className="mt-3 font-inter text-sm leading-relaxed text-ink/80">
              &ldquo;{r.comment}&rdquo;
            </p>
            {r.photos && r.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.photos.map((url, idx) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-14 w-14 overflow-hidden rounded-lg border border-black/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo client ${idx + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            <p className="mt-4 font-syne text-sm font-bold text-ink">{r.name}</p>
            {r.productName && (
              <p className="font-inter text-xs text-ink/50">{r.productName}</p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
