/**
 * Auth store — zustand + expo-secure-store for token persistence.
 * Matches the shape used by the web app's auth.ts.
 */
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { setTokens, apiPost } from "./api";

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  // Actions
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: {
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
}

const USER_KEY = "auth_user";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  async hydrate() {
    try {
      const [rawUser, access, refresh] = await Promise.all([
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync("access_token"),
        SecureStore.getItemAsync("refresh_token"),
      ]);
      if (rawUser && access) {
        set({
          user: JSON.parse(rawUser) as AuthUser,
          accessToken: access,
          refreshToken: refresh,
        });
      }
    } catch (err) {
      console.warn("Auth hydrate failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  async setAuth(user, accessToken, refreshToken) {
    await Promise.all([
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      setTokens(accessToken, refreshToken),
    ]);
    set({ user, accessToken, refreshToken, isLoading: false });
  },

  async login(phone, password) {
    const res = await apiPost<AuthResponse>(
      "/auth/login",
      { phone, password },
      { auth: false },
    );
    await useAuth.getState().setAuth(res.user, res.accessToken, res.refreshToken);
  },

  async register(input) {
    const res = await apiPost<AuthResponse>("/auth/register", input, {
      auth: false,
    });
    await useAuth.getState().setAuth(res.user, res.accessToken, res.refreshToken);
  },

  async logout() {
    await Promise.all([
      SecureStore.deleteItemAsync(USER_KEY),
      setTokens(null, null),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
