"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedSearch {
  id: string;
  label: string;
  breed?: string;
  minPrice?: number;
  maxPrice?: number;
  province?: string;
  category?: string;
  alertsEnabled: boolean;
  createdAt: number;
}

interface SavedSearchesStore {
  searches: SavedSearch[];
  save: (s: Omit<SavedSearch, "id" | "createdAt">) => SavedSearch;
  remove: (id: string) => void;
  toggleAlert: (id: string) => void;
}

export const useSavedSearches = create<SavedSearchesStore>()(
  persist(
    (set) => ({
      searches: [],
      save: (input) => {
        const s: SavedSearch = {
          ...input,
          id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          alertsEnabled: input.alertsEnabled ?? true,
        };
        set((state) => ({ searches: [s, ...state.searches] }));
        return s;
      },
      remove: (id) => {
        set((state) => ({
          searches: state.searches.filter((s) => s.id !== id),
        }));
      },
      toggleAlert: (id) => {
        set((state) => ({
          searches: state.searches.map((s) =>
            s.id === id ? { ...s, alertsEnabled: !s.alertsEnabled } : s,
          ),
        }));
      },
    }),
    { name: "bloodlineph-saved-searches" },
  ),
);

export function summarizeSearch(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.breed) parts.push(s.breed);
  if (s.category) parts.push(s.category);
  if (s.minPrice || s.maxPrice) {
    parts.push(
      `${s.minPrice ? `₱${s.minPrice.toLocaleString()}` : "any"}–${s.maxPrice ? `₱${s.maxPrice.toLocaleString()}` : "any"}`,
    );
  }
  if (s.province) parts.push(`in ${s.province}`);
  return parts.join(" · ") || "Any listing";
}
