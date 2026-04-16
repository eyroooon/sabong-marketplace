"use client";

import { useT } from "@/lib/i18n/context";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useT();

  if (compact) {
    return (
      <button
        onClick={() => setLang(lang === "en" ? "fil" : "en")}
        className="text-sm font-medium px-3 py-1 rounded-full border border-gray-200 hover:border-red-500 hover:text-red-600 transition-colors"
        aria-label="Switch language"
      >
        {lang === "en" ? "🇵🇭 FIL" : "🇺🇸 EN"}
      </button>
    );
  }

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
          lang === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLang("fil")}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
          lang === "fil" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
        }`}
      >
        Filipino
      </button>
    </div>
  );
}
