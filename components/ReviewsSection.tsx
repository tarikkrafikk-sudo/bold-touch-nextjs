"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  productName: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

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

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment }),
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
