/**
 * API client for BloodlinePH mobile.
 * Mirrors apps/web/src/lib/api.ts — adds Authorization header, auto-refreshes
 * on 401 with refresh token, throws typed errors.
 */
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "./secure-storage";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function setTokens(access: string | null, refresh: string | null) {
  if (access) {
    await setSecureItem(ACCESS_KEY, access);
  } else {
    await deleteSecureItem(ACCESS_KEY);
  }
  if (refresh) {
    await setSecureItem(REFRESH_KEY, refresh);
  } else {
    await deleteSecureItem(REFRESH_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refresh}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // default true when token present
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders = {}, auth } = opts;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...extraHeaders,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token && auth !== false) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = await getAccessToken();
  let res = await doFetch(token);

  // Retry once with refreshed token on 401
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      message = errBody.message || errBody.error || message;
    } catch {
      // Non-JSON body
    }
    throw new ApiError(res.status, message);
  }

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function apiGet<T = unknown>(path: string, opts?: FetchOptions) {
  return apiFetch<T>(path, { ...opts, method: "GET" });
}
export function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  opts?: FetchOptions,
) {
  return apiFetch<T>(path, { ...opts, method: "POST", body });
}
export function apiPatch<T = unknown>(
  path: string,
  body?: unknown,
  opts?: FetchOptions,
) {
  return apiFetch<T>(path, { ...opts, method: "PATCH", body });
}
export function apiDelete<T = unknown>(path: string, opts?: FetchOptions) {
  return apiFetch<T>(path, { ...opts, method: "DELETE" });
}

export { API_BASE };
