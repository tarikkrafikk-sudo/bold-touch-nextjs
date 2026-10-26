"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Plus, Trash2, UploadCloud, Inbox, Pencil, X, Star, Check, Ban, Download } from "lucide-react";
import type { Product } from "@/lib/products";
import { categoryLabelsFr, colorSwatch } from "@/lib/products";
import type { Realisation } from "@/data/realisations";
import type { CustomRequest } from "@/lib/requests-store";
import type { Review, ReviewStatus } from "@/lib/reviews-store";

export default function AdminDashboard({
  initialProducts,
  initialRealisations,
  initialRequests,
  initialReviews,
}: {
  initialProducts: Product[];
  initialRealisations: Realisation[];
  initialRequests: CustomRequest[];
  initialReviews: Review[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const realisationFormRef = useRef<HTMLFormElement>(null);
  const [products, setProducts] = useState(initialProducts);
  const [realisations, setRealisations] = useState(initialRealisations);
  const [requests, setRequests] = useState(initialRequests);
  const [reviews, setReviews] = useState(initialReviews);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [realisationSubmitting, setRealisationSubmitting] = useState(false);
  const [realisationError, setRealisationError] = useState("");
  const [realisationPreview, setRealisationPreview] = useState<string | null>(null);
  const [editingRealisation, setEditingRealisation] = useState<Realisation | null>(null);
  const [editRealisationPreview, setEditRealisationPreview] = useState<string | null>(null);
  const [editRealisationSubmitting, setEditRealisationSubmitting] = useState(false);
  const [editRealisationError, setEditRealisationError] = useState("");

  const productCats = Object.entries(categoryLabelsFr);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'ajouter ce produit.");
        return;
      }
      setProducts(data.products);
      formRef.current?.reset();
      setPreview(null);
    } catch {
      setError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setProducts(data.products);
    } catch {
      setError("Impossible de supprimer ce produit pour le moment.");
    }
  }

  async function handleAddRealisation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRealisationError("");
    setRealisationSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/realisations", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setRealisationError(data.error || "Impossible d'ajouter cette réalisation.");
        return;
      }
      setRealisations(data.realisations);
      realisationFormRef.current?.reset();
      setRealisationPreview(null);
    } catch {
      setRealisationError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setRealisationSubmitting(false);
    }
  }

  async function handleDeleteRealisation(id: string) {
    if (!confirm("Supprimer cette réalisation ?")) return;
    try {
      const res = await fetch(`/api/admin/realisations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setRealisations(data.realisations);
    } catch {
      setRealisationError("Impossible de supprimer cette réalisation pour le moment.");
    }
  }

  function openEditRealisation(r: Realisation) {
    setEditingRealisation(r);
    setEditRealisationPreview(null);
    setEditRealisationError("");
  }

  async function handleUpdateRealisation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingRealisation) return;
    setEditRealisationError("");
    setEditRealisationSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch(`/api/admin/realisations/${editingRealisation.id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setEditRealisationError(data.error || "Impossible de modifier cette réalisation.");
        return;
      }
      setRealisations(data.realisations);
      setEditingRealisation(null);
      setEditRealisationPreview(null);
    } catch {
      setEditRealisationError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setEditRealisationSubmitting(false);
    }
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setEditPreview(null);
    setEditError("");
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError("");
    setEditSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Impossible de modifier ce produit.");
        return;
      }
      setProducts(data.products);
      setEditingProduct(null);
      setEditPreview(null);
    } catch {
      setEditError("Une erreur réseau est survenue. Réessayez.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteRequest(id: string) {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setRequests(data.requests);
    } catch {
      setError("Impossible de supprimer cette demande pour le moment.");
    }
  }

  async function handleReviewStatus(id: string, status: ReviewStatus) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) setReviews(data.reviews);
    } catch {
      setError("Impossible de mettre à jour cet avis pour le moment.");
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setReviews(data.reviews);
    } catch {
      setError("Impossible de supprimer cet avis pour le moment.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Administration
          </p>
          <h1 className="font-syne text-3xl font-bold">Gérer la boutique</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 font-inter text-sm font-medium hover:bg-black/5"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>

      {/* Add product form */}
      <form
        ref={formRef}
        onSubmit={handleAdd}
        encType="multipart/form-data"
        className="mt-8 grid gap-4 rounded-[20px] border border-black/10 bg-white p-6 md:grid-cols-2"
      >
        <h2 className="font-syne text-lg font-bold md:col-span-2">
          Ajouter un produit
        </h2>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Nom du produit *
          </label>
          <input
            name="name"
            required
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="Mug Dégradé Coucher de Soleil"
          />
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Prix (MAD) *
          </label>
          <input
            name="price"
            type="number"
            min="1"
            step="1"
            required
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="179"
          />
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Catégorie *
          </label>
          <select
            name="cat"
            required
            className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            {productCats.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Badge
          </label>
          <select
            name="badge"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <option value="">Aucun</option>
            <option value="bestseller">Best-seller</option>
            <option value="new">Nouveau</option>
            <option value="gift">Idée cadeau</option>
          </select>
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Couleurs (séparées par virgule)
          </label>
          <input
            name="colors"
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="Blanc, Sable, Terracotta"
          />
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Tailles (optionnel, séparées par virgule)
          </label>
          <input
            name="sizes"
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="S, M, L, XL"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Description
          </label>
          <textarea
            name="desc"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="Détail du produit, matière, personnalisation possible..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Photo du produit
          </label>
          <div className="mt-1.5 flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-black/25 bg-cream2 px-4 py-2.5 font-inter text-sm hover:border-black/40">
              <UploadCloud size={16} />
              Choisir une image
              <input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
            {preview && (
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="font-inter text-sm text-red-600 md:col-span-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60 md:col-span-2 md:w-fit"
        >
          <Plus size={16} />
          {submitting ? "Ajout en cours..." : "Ajouter le produit"}
        </button>
      </form>

      {/* Product list */}
      <div className="mt-10">
        <h2 className="font-syne text-lg font-bold">
          Produits en ligne ({products.length})
        </h2>
        <div className="mt-4 grid gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={p.image} alt={p.name.fr} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-grotesk text-sm font-medium">{p.name.fr}</p>
                <div className="mt-0.5 flex items-center gap-2 font-inter text-xs text-ink/60">
                  <span className="capitalize">{p.cat}</span>
                  <span>·</span>
                  <span>{p.price} MAD</span>
                  <span className="flex items-center gap-1">
                    {p.colors.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ background: colorSwatch(c) }}
                      />
                    ))}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openEdit(p)}
                aria-label="Modifier"
                className="shrink-0 rounded-full p-2.5 text-ink/60 hover:bg-black/5"
              >
                <Pencil size={17} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                aria-label="Supprimer"
                className="shrink-0 rounded-full p-2.5 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add realisation form */}
      <form
        ref={realisationFormRef}
        onSubmit={handleAddRealisation}
        encType="multipart/form-data"
        className="mt-12 grid gap-4 rounded-[20px] border border-black/10 bg-white p-6 md:grid-cols-2"
      >
        <h2 className="font-syne text-lg font-bold md:col-span-2">
          Ajouter une réalisation (page « Nos Réalisations »)
        </h2>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Nom du modèle *
          </label>
          <input
            name="product"
            required
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="Mug Dégradé Coucher de Soleil"
          />
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Client / ville (optionnel)
          </label>
          <input
            name="client"
            className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            placeholder="Client — Agadir"
          />
        </div>

        <div>
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Catégorie *
          </label>
          <select
            name="cat"
            required
            className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            {productCats.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
            Photo de la réalisation *
          </label>
          <div className="mt-1.5 flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-black/25 bg-cream2 px-4 py-2.5 font-inter text-sm hover:border-black/40">
              <UploadCloud size={16} />
              Choisir une image
              <input
                type="file"
                name="image"
                required
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setRealisationPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
            {realisationPreview && (
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={realisationPreview}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {realisationError && (
          <p className="font-inter text-sm text-red-600 md:col-span-2">{realisationError}</p>
        )}

        <button
          type="submit"
          disabled={realisationSubmitting}
          className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60 md:col-span-2 md:w-fit"
        >
          <Plus size={16} />
          {realisationSubmitting ? "Ajout en cours..." : "Ajouter la réalisation"}
        </button>
      </form>

      {/* Realisations list */}
      <div className="mt-6">
        <h2 className="font-syne text-lg font-bold">
          Réalisations en ligne ({realisations.length})
        </h2>
        {realisations.length === 0 ? (
          <p className="mt-3 font-inter text-sm text-ink/60">
            Aucune réalisation pour le moment.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {realisations.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={r.image} alt={r.product} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-grotesk text-sm font-medium">{r.product}</p>
                  <div className="mt-0.5 flex items-center gap-2 font-inter text-xs text-ink/60">
                    <span className="capitalize">{r.cat}</span>
                    <span>·</span>
                    <span>{r.client}</span>
                  </div>
                </div>
                <button
                  onClick={() => openEditRealisation(r)}
                  aria-label="Modifier"
                  className="shrink-0 rounded-full p-2.5 text-ink/60 hover:bg-black/5"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => handleDeleteRealisation(r.id)}
                  aria-label="Supprimer"
                  className="shrink-0 rounded-full p-2.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit realisation modal */}
      {editingRealisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleUpdateRealisation}
            encType="multipart/form-data"
            className="grid max-h-[90vh] w-full max-w-lg gap-4 overflow-y-auto rounded-[20px] bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-syne text-lg font-bold">
                Modifier « {editingRealisation.product} »
              </h2>
              <button
                type="button"
                onClick={() => setEditingRealisation(null)}
                aria-label="Fermer"
                className="rounded-full p-1.5 hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Nom du modèle
              </label>
              <input
                name="product"
                defaultValue={editingRealisation.product}
                className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Client / ville
                </label>
                <input
                  name="client"
                  defaultValue={editingRealisation.client}
                  className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                />
              </div>
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Catégorie
                </label>
                <select
                  name="cat"
                  defaultValue={editingRealisation.cat}
                  className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                >
                  {productCats.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Photo (laissez vide pour garder l&apos;actuelle)
              </label>
              <div className="mt-1.5 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-black/25 bg-cream2 px-4 py-2.5 font-inter text-sm hover:border-black/40">
                  <UploadCloud size={16} />
                  Remplacer la photo
                  <input
                    type="file"
                    name="image"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setEditRealisationPreview(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                </label>
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-black/10">
                  {editRealisationPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editRealisationPreview} alt="Aperçu" className="h-full w-full object-cover" />
                  ) : (
                    <Image
                      src={editingRealisation.image}
                      alt={editingRealisation.product}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {editRealisationError && (
              <p className="font-inter text-sm text-red-600">{editRealisationError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={editRealisationSubmitting}
                className="rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {editRealisationSubmitting ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setEditingRealisation(null)}
                className="rounded-full border border-black/15 px-6 py-3 font-inter text-sm font-medium hover:bg-black/5"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit product modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleUpdate}
            encType="multipart/form-data"
            className="grid max-h-[90vh] w-full max-w-lg gap-4 overflow-y-auto rounded-[20px] bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-syne text-lg font-bold">
                Modifier « {editingProduct.name.fr} »
              </h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                aria-label="Fermer"
                className="rounded-full p-1.5 hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Nom du produit
              </label>
              <input
                name="name"
                defaultValue={editingProduct.name.fr}
                className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Prix (MAD)
                </label>
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={editingProduct.price}
                  className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                />
              </div>
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Catégorie
                </label>
                <select
                  name="cat"
                  defaultValue={editingProduct.cat}
                  className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                >
                  {productCats.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Badge
                </label>
                <select
                  name="badge"
                  defaultValue={editingProduct.badge ?? "none"}
                  className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                >
                  <option value="none">Aucun</option>
                  <option value="bestseller">Best-seller</option>
                  <option value="new">Nouveau</option>
                  <option value="gift">Idée cadeau</option>
                </select>
              </div>
              <div>
                <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                  Couleurs
                </label>
                <input
                  name="colors"
                  defaultValue={editingProduct.colors.join(", ")}
                  className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                />
              </div>
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Tailles (optionnel)
              </label>
              <input
                name="sizes"
                defaultValue={editingProduct.sizes?.join(", ") ?? ""}
                className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Description
              </label>
              <textarea
                name="desc"
                rows={2}
                defaultValue={editingProduct.desc.fr}
                className="mt-1.5 w-full rounded-xl border border-black/15 px-3 py-2.5 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </div>

            <div>
              <label className="block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
                Photo (laissez vide pour garder l&apos;actuelle)
              </label>
              <div className="mt-1.5 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-black/25 bg-cream2 px-4 py-2.5 font-inter text-sm hover:border-black/40">
                  <UploadCloud size={16} />
                  Remplacer la photo
                  <input
                    type="file"
                    name="image"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setEditPreview(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                </label>
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-black/10">
                  {editPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editPreview} alt="Aperçu" className="h-full w-full object-cover" />
                  ) : (
                    <Image
                      src={editingProduct.image}
                      alt={editingProduct.name.fr}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {editError && (
              <p className="font-inter text-sm text-red-600">{editError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={editSubmitting}
                className="rounded-full bg-ink px-6 py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {editSubmitting ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full border border-black/15 px-6 py-3 font-inter text-sm font-medium hover:bg-black/5"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews moderation */}
      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-syne text-lg font-bold">
          <Star size={18} />
          Avis clients ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-3 font-inter text-sm text-ink/60">
            Aucun avis pour le moment.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-grotesk text-sm font-medium">{r.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : r.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status === "approved"
                        ? "Approuvé"
                        : r.status === "rejected"
                        ? "Refusé"
                        : "En attente"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={12}
                        className={idx < r.rating ? "fill-gold text-gold" : "text-ink/15"}
                      />
                    ))}
                  </div>
                  <p className="mt-1 font-inter text-xs italic text-ink/60">
                    “{r.comment}”
                  </p>
                  {r.photos && r.photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.photos.map((url, idx) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block h-12 w-12 overflow-hidden rounded-lg border border-black/10"
                        >
                          <Image src={url} alt={`Photo client ${idx + 1}`} fill className="object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => handleReviewStatus(r.id, "approved")}
                      aria-label="Approuver"
                      className="rounded-full p-2.5 text-green-700 hover:bg-green-50"
                    >
                      <Check size={17} />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => handleReviewStatus(r.id, "rejected")}
                      aria-label="Refuser"
                      className="rounded-full p-2.5 text-amber-700 hover:bg-amber-50"
                    >
                      <Ban size={17} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    aria-label="Supprimer l'avis"
                    className="rounded-full p-2.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer requests */}
      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-syne text-lg font-bold">
          <Inbox size={18} />
          Demandes clients ({requests.length})
        </h2>

        {requests.length === 0 ? (
          <p className="mt-3 font-inter text-sm text-ink/60">
            Aucune demande pour le moment.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/10 bg-white p-3"
              >
                {r.uploadedPhotos && r.uploadedPhotos.length > 0 ? (
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {r.uploadedPhotos.map((ph, i) => (
                      <div key={ph.id} className="relative h-16 w-16 overflow-hidden rounded-xl">
                        <Image src={ph.url} alt={`Photo client ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : r.photoUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={r.photoUrl} alt="Photo client" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-cream2 font-inter text-[10px] text-ink/40">
                    Pas de photo
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-grotesk text-sm font-medium">
                    {r.productName}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 font-inter text-xs text-ink/60">
                    {r.color && <span>Couleur : {r.color}</span>}
                    {r.size && (
                      <>
                        <span>·</span>
                        <span>Taille : {r.size}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Qté : {r.qty ?? 1}</span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  {r.customText && (
                    <p
                      className="mt-1 font-inter text-xs text-ink/70"
                      style={{ fontFamily: r.selectedFont || undefined, color: r.textColor || undefined }}
                    >
                      ✍️ “{r.customText}” — {r.textPosition} — {r.textSize ?? 100}%
                    </p>
                  )}
                  {r.uploadedPhotos && r.uploadedPhotos.length > 0 ? (
                    <p className="mt-0.5 font-inter text-[11px] text-ink/50">
                      {r.uploadedPhotos.length} photo(s) — tailles :{" "}
                      {r.uploadedPhotos.map((p) => `${p.size}%`).join(", ")}
                    </p>
                  ) : (
                    r.photoUrl &&
                    r.photoSize && (
                      <p className="mt-0.5 font-inter text-[11px] text-ink/50">
                        Taille photo : {r.photoSize}%
                      </p>
                    )
                  )}
                  {r.note && (
                    <p className="mt-1 font-inter text-xs italic text-ink/60">
                      “{r.note}”
                    </p>
                  )}
                </div>

                {r.uploadedPhotos && r.uploadedPhotos.length > 0 ? (
                  <div className="flex shrink-0 flex-col gap-1">
                    {r.uploadedPhotos.map((ph, i) => (
                      <a
                        key={ph.id}
                        href={ph.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Télécharger la photo ${i + 1}`}
                        className="flex items-center gap-1 rounded-full p-1.5 text-ink/70 hover:bg-black/5"
                      >
                        <Download size={15} />
                        <span className="font-inter text-[11px]">{i + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  r.photoUrl && (
                    <a
                      href={r.photoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Télécharger la photo"
                      className="shrink-0 rounded-full p-2.5 text-ink/70 hover:bg-black/5"
                    >
                      <Download size={17} />
                    </a>
                  )
                )}

                <button
                  onClick={() => handleDeleteRequest(r.id)}
                  aria-label="Supprimer la demande"
                  className="shrink-0 rounded-full p-2.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
