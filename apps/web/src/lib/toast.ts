"use client";

import { create } from "zustand";

export type ToastAccent = "green" | "red" | "amber" | "blue" | "gold";

export interface ToastInput {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  accent?: ToastAccent;
  duration?: number;
}

export interface Toast extends ToastInput {
  id: string;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  show: (t: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (t) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = {
      id,
      createdAt: Date.now(),
      accent: t.accent ?? "blue",
      duration: t.duration ?? 4000,
      ...t,
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/**
 * Convenience hook. Mirrors the API described in the task:
 *   const { show } = useToast();
 *   show({ title, body, accent });
 */
export function useToast() {
  const show = useToastStore((s) => s.show);
  const dismiss = useToastStore((s) => s.dismiss);
  const clear = useToastStore((s) => s.clear);
  return { show, dismiss, clear };
}
