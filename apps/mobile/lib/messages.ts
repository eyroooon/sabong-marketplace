/**
 * Messages data layer — react-query hooks wrapping /messages endpoints.
 * Real-time updates come through lib/socket.ts and invalidate these queries.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./api";

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  unreadCount: number; // precomputed by API for current user
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "offer";
  offerAmount: string | null;
  offerStatus: "pending" | "accepted" | "rejected" | null;
  createdAt: string;
}

export interface MessagesResponse {
  data: Message[];
  conversation: Conversation & { otherUser?: Conversation["otherUser"] };
}

export function useConversations() {
  return useQuery<{ data: Conversation[] }, Error>({
    queryKey: ["conversations"],
    queryFn: () => apiGet<{ data: Conversation[] }>("/messages/conversations"),
    staleTime: 10_000,
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery<MessagesResponse, Error>({
    queryKey: ["conversations", conversationId, "messages"],
    enabled: !!conversationId,
    queryFn: () =>
      apiGet<MessagesResponse>(
        `/messages/conversations/${conversationId}?limit=100`,
      ),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation<Message, Error, { content: string; offerAmount?: number }>(
    {
      mutationFn: (input) =>
        apiPost<Message>(`/messages/conversations/${conversationId}`, {
          content: input.content,
          messageType: input.offerAmount != null ? "offer" : "text",
          offerAmount: input.offerAmount,
        }),
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: ["conversations", conversationId, "messages"],
        });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      },
    },
  );
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation<
    { conversationId: string; isNew: boolean },
    Error,
    { sellerId: string; listingId: string; message: string }
  >({
    mutationFn: (input) =>
      apiPost<{ conversationId: string; isNew: boolean }>(
        "/messages/conversations",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, void>({
    mutationFn: () =>
      apiPatch<{ message: string }>(
        `/messages/conversations/${conversationId}/read`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/** Helper: format relative time like "2m ago", "just now" */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
