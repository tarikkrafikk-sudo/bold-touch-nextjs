"use client";

import { categoryIds } from "@/lib/products";
import { useLanguage } from "./LanguageProvider";

export default function CategoryFilters({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {categoryIds.map((id) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`shrink-0 rounded-full border px-5 py-2 font-inter text-sm font-medium transition-all duration-200 ${
              isActive
                ? "border-ink bg-ink text-cream"
                : "border-black/15 bg-white text-ink hover:border-black/30"
            }`}
          >
            {t(`cat.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
