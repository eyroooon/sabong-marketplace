import { useAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

// Token refresh state — prevents concurrent refresh attempts
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Decode JWT payload without verification (client-side only).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): { sub: string; exp: number; phone: string; role: string } | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Attempt to refresh the access token using the current (still-valid) access token.
 * The backend's /auth/refresh endpoint uses JwtAuthGuard, so the access token
 * must still be valid. We call this proactively before expiry.
 */
async function doRefresh(currentAccessToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentAccessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Token refresh failed");
  }

  return res.json();
}

/**
 * Schedule proactive token refresh ~2 minutes before expiry.
 */
export function scheduleTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const { accessToken } = useAuth.getState();
  if (!accessToken) return;

  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) return;

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  const refreshAt = expiresAt - 2 * 60 * 1000; // 2 minutes before expiry
  const delay = Math.max(refreshAt - now, 0);

  // If token already expired or expires in < 10 seconds, refresh immediately
  if (expiresAt - now < 10_000) {
    refreshTokens();
    return;
  }

  refreshTimer = setTimeout(() => {
    refreshTokens();
  }, delay);
}

/**
 * Perform token refresh with deduplication.
 */
async function refreshTokens(): Promise<boolean> {
  const { accessToken, updateTokens, logout } = useAuth.getState();
  if (!accessToken) return false;

  if (refreshPromise) {
    try {
      await refreshPromise;
      return true;
    } catch {
      return false;
    }
  }

  try {
    refreshPromise = doRefresh(accessToken);
    const tokens = await refreshPromise;
    updateTokens(tokens.accessToken, tokens.refreshToken);
    scheduleTokenRefresh(); // Schedule next refresh
    return true;
  } catch {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return false;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Core API function with automatic 401 handling.
 */
export async function api<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (res.status === 401 && token) {
    // Try to refresh and retry the request once
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = useAuth.getState().accessToken;
      const retryRes = await fetch(`${API_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...headers,
        },
        ...rest,
      });

      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ message: retryRes.statusText }));
        throw new Error(error.message || "API request failed");
      }

      return retryRes.json();
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "API request failed");
  }

  return res.json();
}

export async function apiGet<T = unknown>(path: string, token?: string) {
  return api<T>(path, { token });
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  token?: string,
) {
  return api<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export async function apiPatch<T = unknown>(
  path: string,
  body: unknown,
  token?: string,
) {
  return api<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

export async function apiDelete<T = unknown>(path: string, token?: string) {
  return api<T>(path, { method: "DELETE", token });
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type — browser sets multipart boundary for FormData
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Upload failed");
  }

  return res.json();
}
