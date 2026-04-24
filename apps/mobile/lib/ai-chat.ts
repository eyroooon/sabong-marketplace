/**
 * AI chat data layer. The backend streams SSE; we accumulate the full
 * response here because RN fetch doesn't stream. The UX trade-off: no
 * live typewriter, but reliable delivery.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, API_BASE, getAccessToken } from "./api";

export interface AiQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number;
  isGuest: boolean;
  isUnlimited: boolean;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a conversation turn to Claude and return the full assistant text
 * plus the updated quota.
 */
async function sendAiMessage(
  messages: AiMessage[],
): Promise<{ text: string; quota: AiQuota | null }> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  });

  if (res.status === 429) {
    let detail = "Daily limit reached.";
    try {
      const json = (await res.json()) as {
        statusCode?: number;
        error?: string;
        message?: string;
        remaining?: number;
        limit?: number;
        resetAt?: number;
      };
      if (typeof json?.message === "string") detail = json.message;
    } catch {
      // ignore
    }
    const err: Error & { rateLimited?: true } = new Error(detail);
    err.rateLimited = true;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`AI chat failed (${res.status})`);
  }

  const raw = await res.text();
  // Parse SSE: split on blank lines, strip "data: " prefix, JSON.parse
  const lines = raw.split("\n");
  let text = "";
  let quota: AiQuota | null = null;
  let sawError: string | null = null;

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]" || payload === "") continue;
    try {
      const obj = JSON.parse(payload) as {
        text?: string;
        quota?: AiQuota;
        error?: string;
      };
      if (typeof obj.text === "string") text += obj.text;
      if (obj.quota) quota = obj.quota;
      if (obj.error) sawError = obj.error;
    } catch {
      // ignore malformed chunks
    }
  }

  if (sawError) throw new Error(sawError);
  return { text, quota };
}

export function useAiQuota() {
  return useQuery<AiQuota, Error>({
    queryKey: ["ai-chat", "quota"],
    queryFn: () => apiGet<AiQuota>("/ai-chat/quota"),
    staleTime: 30_000,
  });
}

export function useSendAiMessage() {
  const qc = useQueryClient();
  return useMutation<
    { text: string; quota: AiQuota | null },
    Error,
    { messages: AiMessage[] }
  >({
    mutationFn: ({ messages }) => sendAiMessage(messages),
    onSuccess: ({ quota }) => {
      if (quota) {
        qc.setQueryData(["ai-chat", "quota"], quota);
      } else {
        void qc.invalidateQueries({ queryKey: ["ai-chat", "quota"] });
      }
    },
  });
}
