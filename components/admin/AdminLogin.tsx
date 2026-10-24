"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Mot de passe incorrect.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[20px] border border-black/10 bg-white p-8 shadow-sm"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream">
          <Lock size={20} />
        </div>
        <h1 className="text-center font-syne text-xl font-bold">
          Espace Administration
        </h1>
        <p className="mt-1 text-center font-inter text-sm text-ink/60">
          BOLD TOUCH — accès réservé
        </p>

        <label className="mt-6 block font-inter text-xs font-medium uppercase tracking-wide text-ink/60">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="mt-2 w-full rounded-xl border border-black/15 bg-cream2 px-4 py-3 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-3 font-inter text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-full bg-ink py-3 font-inter text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
