/**
 * WebSocket client — connects to the NestJS /chat namespace with JWT auth
 * and wires server events into react-query invalidations so the UI updates
 * without polling.
 *
 * Usage:
 *   const qc = useQueryClient();
 *   useChatSocket(qc); // once in a top-level screen
 */
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { QueryClient } from "@tanstack/react-query";
import { getAccessToken, API_BASE } from "./api";
import type { Message } from "./messages";

// API_BASE is e.g. "http://192.168.50.4:3001/api" — strip /api for the socket origin
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

let sharedSocket: Socket | null = null;

async function getSocket(): Promise<Socket | null> {
  const token = await getAccessToken();
  if (!token) return null;

  if (sharedSocket && sharedSocket.connected) return sharedSocket;

  if (sharedSocket) sharedSocket.disconnect();

  sharedSocket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return sharedSocket;
}

/**
 * Hook to wire the chat socket to a react-query client. On `newMessage` and
 * `conversationUpdated` events, invalidate the relevant queries so the UI
 * refreshes with fresh data from the API.
 */
export function useChatSocket(qc: QueryClient) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSocket();
      if (cancelled || !s) return;
      socketRef.current = s;

      s.on("newMessage", (msg: Message) => {
        qc.invalidateQueries({
          queryKey: ["conversations", msg.conversationId, "messages"],
        });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      });

      s.on("conversationUpdated", () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      });

      s.on("newConversation", () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      });
    })();

    return () => {
      cancelled = true;
      // Keep socket alive across navigations; individual rooms are
      // joined/left via joinConversation / leaveConversation.
    };
  }, [qc]);
}

/** Join a conversation room so server pushes messages to this client */
export async function joinConversation(conversationId: string) {
  const s = await getSocket();
  s?.emit("joinConversation", conversationId);
}

/** Leave a conversation room (on chat screen unmount) */
export async function leaveConversation(conversationId: string) {
  const s = await getSocket();
  s?.emit("leaveConversation", conversationId);
}

/** Explicitly disconnect (e.g. on logout) */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
