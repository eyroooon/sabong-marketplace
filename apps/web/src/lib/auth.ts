"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { disconnectSocket } from "./socket";

interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        setCookie("sabong-access-token", accessToken, 604800); // 7 days
        set({ user, accessToken, refreshToken });
      },
      updateTokens: (accessToken, refreshToken) => {
        setCookie("sabong-access-token", accessToken, 604800);
        set({ accessToken, refreshToken });
      },
      logout: () => {
        disconnectSocket();
        clearCookie("sabong-access-token");
        set({ user: null, accessToken: null, refreshToken: null });
      },
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: "sabong-auth" },
  ),
);
