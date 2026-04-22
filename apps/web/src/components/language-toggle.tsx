"use client";

import { Globe } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function LanguageToggle({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const { lang, setLang } = useT();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "fil" : "en")}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        variant === "dark"
          ? "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      } ${className}`}
      title={lang === "en" ? "Switch to Filipino" : "Switch to English"}
      aria-label={`Language toggle. Currently ${lang === "en" ? "English" : "Filipino"}.`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="font-bold uppercase tracking-wide">
        {lang === "en" ? "EN" : "FIL"}
      </span>
    </button>
  );
}
