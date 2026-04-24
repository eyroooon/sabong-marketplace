/**
 * WebSocket client — connects to the NestJS /chat namespace with JWT auth
 * and wires server events into react-query invalidations so the UI updates
 * without polling.
 *
 * Usage:
 *   const qc = useQueryClient();
 *   useChatSocket(qc); // once in a top-level screen
 */
import { useEffect, useRef, useState } from "react";
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

/**
 * Emit typing state to the server. Debounced — calling it rapidly only
 * emits the transition from not-typing → typing once, and auto-emits
 * 'not typing' after a 3-second idle timeout.
 *
 * Call `notifyTyping(true)` on every input change. Call `notifyTyping(false)`
 * once on screen unmount to ensure the peer sees you stop.
 */
export function useTypingEmitter(conversationId: string | undefined) {
  const lastEmitRef = useRef<{ value: boolean; at: number }>({
    value: false,
    at: 0,
  });
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      // Best-effort: tell peer we stopped typing on unmount
      if (conversationId && lastEmitRef.current.value) {
        void (async () => {
          const s = await getSocket();
          s?.emit("typing", { conversationId, isTyping: false });
        })();
      }
    };
  }, [conversationId]);

  return async function notifyTyping(isTyping: boolean): Promise<void> {
    if (!conversationId) return;
    const now = Date.now();
    const prev = lastEmitRef.current;

    // If state unchanged and we emitted recently, do nothing
    if (prev.value === isTyping && now - prev.at < 1000) return;

    // Emit the transition
    lastEmitRef.current = { value: isTyping, at: now };
    const s = await getSocket();
    s?.emit("typing", { conversationId, isTyping });

    // Schedule automatic 'stop typing' after idle
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isTyping) {
      idleTimerRef.current = setTimeout(async () => {
        const socket = await getSocket();
        socket?.emit("typing", { conversationId, isTyping: false });
        lastEmitRef.current = { value: false, at: Date.now() };
      }, 3000);
    }
  };
}

/**
 * Subscribe to peer typing events for the given conversation. Returns
 * true while a peer is typing, automatically clearing after 5 seconds
 * of no updates (safety fallback in case a 'stop' event is dropped).
 *
 * Filters out your own userId so you don't see yourself typing.
 */
export function usePeerTyping(
  conversationId: string | undefined,
  currentUserId: string | undefined,
): boolean {
  const [peerTyping, setPeerTyping] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    (async () => {
      const s = await getSocket();
      if (cancelled || !s) return;

      const onTyping = (payload: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }) => {
        if (payload.conversationId !== conversationId) return;
        if (currentUserId && payload.userId === currentUserId) return;

        if (payload.isTyping) {
          setPeerTyping(true);
          if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
          clearTimerRef.current = setTimeout(() => {
            setPeerTyping(false);
          }, 5000);
        } else {
          if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
          setPeerTyping(false);
        }
      };

      s.on("typing", onTyping);

      return () => {
        s.off("typing", onTyping);
      };
    })();

    return () => {
      cancelled = true;
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setPeerTyping(false);
    };
  }, [conversationId, currentUserId]);

  return peerTyping;
}
