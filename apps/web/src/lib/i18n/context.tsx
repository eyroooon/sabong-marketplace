"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Language } from "./translations";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("sabong-lang") as Language | null;
    if (stored === "en" || stored === "fil") setLangState(stored);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("sabong-lang", l);
    document.documentElement.lang = l === "fil" ? "fil-PH" : "en-PH";
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let result: any = translations[lang];
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) {
        // Fallback to English
        let fallback: any = translations.en;
        for (const k of keys) fallback = fallback?.[k];
        return fallback ?? path;
      }
    }
    return typeof result === "string" ? result : path;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
