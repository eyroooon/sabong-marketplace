const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T = any>(
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "API request failed");
  }

  return res.json();
}

export async function apiGet<T = any>(path: string, token?: string) {
  return api<T>(path, { token });
}

export async function apiPost<T = any>(
  path: string,
  body: any,
  token?: string,
) {
  return api<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export async function apiPatch<T = any>(
  path: string,
  body: any,
  token?: string,
) {
  return api<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

export async function apiDelete<T = any>(path: string, token?: string) {
  return api<T>(path, { method: "DELETE", token });
}
