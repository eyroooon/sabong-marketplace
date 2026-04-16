"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/context";

export function HeroSearch() {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/listings");
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <form onSubmit={handleSubmit} className="flex overflow-hidden rounded-xl bg-white">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="flex-1 px-4 py-3 text-foreground focus:outline-none"
        />
        <button
          type="submit"
          className="bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90"
        >
          {t("home.searchButton")}
        </button>
      </form>
    </div>
  );
}
