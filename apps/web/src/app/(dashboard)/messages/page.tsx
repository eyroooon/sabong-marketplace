"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function MessagesPage() {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConvList, setShowConvList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConvRef = useRef<any>(null);
  selectedConvRef.current = selectedConv;

  useEffect(() => {
    fetchConversations();

    // Fallback poll every 60 seconds in case WebSocket disconnects
    const convInterval = setInterval(() => {
      if (accessToken) {
        apiGet("/messages/conversations", accessToken)
          .then((res: any) => setConversations(res.data || []))
          .catch(() => {});
      }
    }, 60000);

    return () => clearInterval(convInterval);
  }, [accessToken]);

  // WebSocket: listen for real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Only append if the message is for the currently selected conversation
      if (selectedConvRef.current?.id === message.conversationId) {
        setMessages((prev) => {
          // Avoid duplicates (from own send or race conditions)
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleConversationUpdated = () => {
      // Refresh conversation list when any conversation is updated
      if (accessToken) {
        apiGet("/messages/conversations", accessToken)
          .then((res: any) => setConversations(res.data || []))
          .catch(() => {});
      }
    };

    const handleNewConversation = () => {
      // Refresh conversation list when a new conversation is created
      if (accessToken) {
        apiGet("/messages/conversations", accessToken)
          .then((res: any) => setConversations(res.data || []))
          .catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    socket.on("newConversation", handleNewConversation);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
      socket.off("newConversation", handleNewConversation);
    };
  }, [accessToken]);

  // WebSocket: join/leave conversation rooms
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConv) return;

    socket.emit("joinConversation", selectedConv.id);

    return () => {
      socket.emit("leaveConversation", selectedConv.id);
    };
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    if (!accessToken) return;
    try {
      const res = await apiGet<any>("/messages/conversations", accessToken);
      setConversations(res.data || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(conv: any) {
    setSelectedConv(conv);
    setShowConvList(false);
    setMessagesLoading(true);
    try {
      const res = await apiGet<any>(`/messages/conversations/${conv.id}`, accessToken!);
      setMessages(res.data || []);
      // Mark as read
      if (conv.unreadCount > 0) {
        await apiPatch(`/messages/conversations/${conv.id}/read`, {}, accessToken!);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
        );
      }
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !accessToken) return;
    setSending(true);
    try {
      const msg = await apiPost(
        `/messages/conversations/${selectedConv.id}`,
        { content: newMessage.trim() },
        accessToken,
      );
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, lastMessagePreview: newMessage.trim().slice(0, 200), lastMessageAt: new Date().toISOString() }
            : c,
        ),
      );
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] sm:h-[calc(100vh-10rem)] flex-col pb-16 sm:pb-0">
      <h1 className="mb-4 text-2xl font-bold md:mb-6">Messages</h1>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-border">
        {/* Conversation List */}
        <div
          className={`w-full border-r border-border md:block md:w-80 ${
            showConvList ? "block" : "hidden"
          }`}
        >
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg p-3">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 rounded bg-muted" />
                        <div className="h-3 w-32 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              <div>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full border-b border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                      selectedConv?.id === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {conv.otherUser?.firstName?.[0] || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium text-sm">
                            {conv.otherUser
                              ? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`
                              : "Unknown"}
                          </p>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            {formatShortTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {conv.lastMessagePreview || "No messages"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start a conversation from a listing page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div
          className={`flex flex-1 flex-col ${
            !showConvList ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-border p-4">
                <button
                  onClick={() => setShowConvList(true)}
                  className="text-muted-foreground hover:text-foreground md:hidden"
                >
                  &larr;
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {selectedConv.otherUser?.firstName?.[0] || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {selectedConv.otherUser
                      ? `${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}`
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? "bg-primary text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.messageType === "offer" && msg.offerAmount && (
                              <div
                                className={`mb-1 rounded-lg p-2 text-xs font-medium ${
                                  isMe ? "bg-white/20" : "bg-primary/10"
                                }`}
                              >
                                Offer:{" "}
                                {new Intl.NumberFormat("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                }).format(Number(msg.offerAmount))}
                                {msg.offerStatus && (
                                  <span className="ml-2 uppercase">[{msg.offerStatus}]</span>
                                )}
                              </div>
                            )}
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isMe ? "text-white/60" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("en-PH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="border-t border-border p-4 mb-14 sm:mb-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-input px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-muted-foreground/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="mt-4 text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatShortTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-PH", { weekday: "short" });
  }
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}
