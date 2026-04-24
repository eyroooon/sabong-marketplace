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
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selfTypingRef = useRef(false);

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

    const handleTyping = (payload: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (
        selectedConvRef.current?.id === payload.conversationId &&
        payload.userId !== user?.id
      ) {
        setOtherIsTyping(payload.isTyping);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("conversationUpdated", handleConversationUpdated);
    socket.on("newConversation", handleNewConversation);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationUpdated", handleConversationUpdated);
      socket.off("newConversation", handleNewConversation);
      socket.off("typing", handleTyping);
    };
  }, [accessToken, user?.id]);

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
    stopTyping();
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

  function broadcastTyping(isTyping: boolean) {
    const socket = getSocket();
    if (!socket || !selectedConv) return;
    socket.emit("typing", { conversationId: selectedConv.id, isTyping });
  }

  function handleTypingChange(text: string) {
    setNewMessage(text);
    if (!selectedConv) return;
    if (!selfTypingRef.current) {
      selfTypingRef.current = true;
      broadcastTyping(true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 1500);
  }

  function stopTyping() {
    if (selfTypingRef.current) {
      selfTypingRef.current = false;
      broadcastTyping(false);
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }

  async function respondToOffer(
    messageId: string,
    decision: "accept" | "reject" | "counter",
    newAmount?: number,
  ) {
    if (!accessToken || !selectedConv) return;
    try {
      await apiPost(
        `/messages/offers/${messageId}/respond`,
        { decision, newAmount },
        accessToken,
      );
      // Refresh messages
      const res = await apiGet<any>(
        `/messages/conversations/${selectedConv.id}`,
        accessToken,
      );
      setMessages(res.data || []);
    } catch (err: any) {
      alert(err?.message || "Failed to respond");
    }
  }

  const [showNewChatModal, setShowNewChatModal] = useState(false);

  async function toggleReaction(messageId: string, emoji: string) {
    if (!accessToken || !selectedConv) return;
    try {
      await apiPost(
        `/messages/${messageId}/reactions`,
        { emoji },
        accessToken,
      );
      // Refresh messages to get updated reactions
      const res = await apiGet<any>(
        `/messages/conversations/${selectedConv.id}`,
        accessToken,
      );
      setMessages(res.data || []);
    } catch {
      // ignore
    }
  }

  function chatTitle(conv: any): string {
    if (!conv) return "";
    if (conv.type === "group") return conv.title || "Group chat";
    if (conv.otherUser) {
      return (
        conv.otherUser.displayName ||
        `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.trim()
      );
    }
    return "Unknown";
  }

  function chatAvatarLetter(conv: any): string {
    if (!conv) return "?";
    if (conv.type === "group") return conv.title?.[0] || "G";
    return conv.otherUser?.firstName?.[0] || "?";
  }

  function chatTypeBadge(conv: any): string | null {
    if (conv.type === "group")
      return `👥 ${conv.participantCount ?? ""} members`;
    if (conv.type === "dm") return "💬 Direct";
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] sm:h-[calc(100vh-10rem)] flex-col pb-16 sm:pb-0">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          + New
        </button>
      </div>

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
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        conv.type === "group"
                          ? "bg-amber-500/10 text-amber-600"
                          : conv.type === "dm"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-primary/10 text-primary"
                      }`}>
                        {chatAvatarLetter(conv)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium text-sm">
                            {chatTitle(conv)}
                          </p>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            {formatShortTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        {chatTypeBadge(conv) && (
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                            {chatTypeBadge(conv)}
                          </p>
                        )}
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
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  selectedConv.type === "group"
                    ? "bg-amber-500/10 text-amber-600"
                    : selectedConv.type === "dm"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-primary/10 text-primary"
                }`}>
                  {chatAvatarLetter(selectedConv)}
                </div>
                <div>
                  <p className="font-medium text-sm">{chatTitle(selectedConv)}</p>
                  {chatTypeBadge(selectedConv) && (
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {chatTypeBadge(selectedConv)}
                    </p>
                  )}
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
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                                    Offer
                                  </span>
                                  <span className="text-sm font-black">
                                    {new Intl.NumberFormat("en-PH", {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 0,
                                    }).format(Number(msg.offerAmount))}
                                  </span>
                                  {msg.offerStatus && msg.offerStatus !== "pending" && (
                                    <span
                                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        msg.offerStatus === "accepted"
                                          ? "bg-green-500 text-white"
                                          : msg.offerStatus === "rejected"
                                            ? "bg-red-500 text-white"
                                            : "bg-amber-500 text-white"
                                      }`}
                                    >
                                      {msg.offerStatus}
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons — only for recipient of pending offer */}
                                {!isMe && msg.offerStatus === "pending" && (
                                  <div className="mt-2 space-y-1">
                                    {counterFor === msg.id ? (
                                      <div className="flex gap-1">
                                        <input
                                          type="number"
                                          value={counterAmount}
                                          onChange={(e) => setCounterAmount(e.target.value)}
                                          placeholder="Counter amount"
                                          className="flex-1 rounded border border-input bg-white px-2 py-1 text-xs text-foreground"
                                        />
                                        <button
                                          onClick={() => {
                                            const n = Number(counterAmount);
                                            if (n > 0) {
                                              respondToOffer(msg.id, "counter", n);
                                              setCounterFor(null);
                                              setCounterAmount("");
                                            }
                                          }}
                                          className="rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-white"
                                        >
                                          Send
                                        </button>
                                        <button
                                          onClick={() => setCounterFor(null)}
                                          className="rounded bg-gray-300 px-2 py-1 text-[10px] font-bold text-gray-800"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => respondToOffer(msg.id, "accept")}
                                          className="flex-1 rounded bg-green-500 py-1 text-[10px] font-bold uppercase text-white hover:bg-green-600"
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() => setCounterFor(msg.id)}
                                          className="flex-1 rounded bg-amber-500 py-1 text-[10px] font-bold uppercase text-white hover:bg-amber-600"
                                        >
                                          ⇄ Counter
                                        </button>
                                        <button
                                          onClick={() => respondToOffer(msg.id, "reject")}
                                          className="flex-1 rounded bg-red-500 py-1 text-[10px] font-bold uppercase text-white hover:bg-red-600"
                                        >
                                          ✗ Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Voice note player */}
                            {msg.messageType === "voice" && msg.mediaUrl ? (
                              <div className="flex items-center gap-2">
                                <audio
                                  controls
                                  src={
                                    msg.mediaUrl.startsWith("http")
                                      ? msg.mediaUrl
                                      : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"}${msg.mediaUrl}`
                                  }
                                  className="max-w-[220px] rounded"
                                />
                                {msg.mediaDurationMs && (
                                  <span className="text-xs opacity-70">
                                    🎤 {Math.round(msg.mediaDurationMs / 1000)}s
                                  </span>
                                )}
                              </div>
                            ) : msg.messageType === "system" ? (
                              <p className="text-center text-[11px] italic opacity-70">
                                {msg.content}
                              </p>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}

                            {/* Reactions pills */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(msg.reactions as Record<string, any>).map(
                                  ([emoji, info]: [string, any]) => {
                                    const reactedByMe = info.userIds?.includes(user?.id);
                                    return (
                                      <button
                                        key={emoji}
                                        onClick={() => toggleReaction(msg.id, emoji)}
                                        className={`rounded-full px-2 py-0.5 text-xs ${
                                          reactedByMe
                                            ? "bg-primary text-white"
                                            : "bg-background text-foreground"
                                        }`}
                                        title={`${info.count} reaction${info.count > 1 ? "s" : ""}`}
                                      >
                                        {emoji} {info.count}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            )}

                            {/* Reaction trigger — visible on hover */}
                            <div
                              className={`mt-1 flex items-center gap-1 ${
                                isMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              {!isMe && msg.messageType !== "system" && (
                                <div className="opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
                                  {["🔥", "💎", "👊", "🏆"].map((e) => (
                                    <button
                                      key={e}
                                      onClick={() => toggleReaction(msg.id, e)}
                                      className="text-xs hover:scale-125"
                                      title={`React with ${e}`}
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <p
                                className={`text-xs ${
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

              {/* Typing indicator */}
              {otherIsTyping && (
                <div className="flex items-center gap-2 px-4 pb-1 text-xs text-muted-foreground">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                  </span>
                  <span>typing…</span>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={sendMessage} className="border-t border-border p-4 mb-14 sm:mb-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    onBlur={stopTyping}
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

      {showNewChatModal && (
        <NewChatModal
          accessToken={accessToken!}
          onClose={() => setShowNewChatModal(false)}
          onCreated={async () => {
            setShowNewChatModal(false);
            await fetchConversations();
          }}
        />
      )}
    </div>
  );
}

function NewChatModal({
  accessToken,
  onClose,
  onCreated,
}: {
  accessToken: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupTitle, setGroupTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const data = await apiGet<any[]>(
          `/users/search?q=${encodeURIComponent(query)}`,
          accessToken,
        );
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query, accessToken]);

  async function createChat() {
    if (mode === "dm") {
      const userId = Array.from(selected)[0];
      if (!userId) return;
      setBusy(true);
      try {
        await apiPost("/messages/dm", { otherUserId: userId }, accessToken);
        onCreated();
      } catch {
        setBusy(false);
      }
    } else {
      if (selected.size < 1 || !groupTitle.trim()) return;
      setBusy(true);
      try {
        await apiPost(
          "/messages/group",
          {
            title: groupTitle.trim(),
            memberUserIds: Array.from(selected),
          },
          accessToken,
        );
        onCreated();
      } catch {
        setBusy(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">New conversation</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setMode("dm");
              setSelected(new Set());
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "dm" ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            💬 Direct Message
          </button>
          <button
            onClick={() => {
              setMode("group");
              setSelected(new Set());
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "group" ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            👥 Group Chat
          </button>
        </div>

        {mode === "group" && (
          <input
            type="text"
            placeholder="Group name (e.g. Kelso Circle)"
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            className="mb-3 w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}

        <input
          type="text"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-lg border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />

        <div className="mb-4 max-h-60 space-y-1 overflow-y-auto">
          {results.map((u) => {
            const isSelected = selected.has(u.id);
            return (
              <button
                key={u.id}
                onClick={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (mode === "dm") {
                      next.clear();
                      next.add(u.id);
                    } else {
                      if (isSelected) next.delete(u.id);
                      else next.add(u.id);
                    }
                    return next;
                  });
                }}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {u.firstName?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {u.displayName || `${u.firstName} ${u.lastName}`}
                  </p>
                  {u.city && (
                    <p className="text-xs text-muted-foreground">
                      {u.city}, {u.province}
                    </p>
                  )}
                </div>
                {isSelected && <span className="text-primary">✓</span>}
              </button>
            );
          })}
          {results.length === 0 && query.length >= 2 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No users found
            </p>
          )}
          {query.length < 2 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Type 2+ characters to search
            </p>
          )}
        </div>

        <button
          onClick={createChat}
          disabled={
            busy ||
            selected.size === 0 ||
            (mode === "group" && !groupTitle.trim())
          }
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {busy
            ? "Creating…"
            : mode === "dm"
              ? "Start DM"
              : `Create group (${selected.size} selected)`}
        </button>
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
