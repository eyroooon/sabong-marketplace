"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { useAuth } from "@/lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Quota {
  used: number;
  remaining: number;
  limit: number;
  resetAt: number;
  isGuest: boolean;
  isUnlimited: boolean;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Kumusta! \ud83d\udc4b I'm your BloodlinePH Assistant. I can help you with breed info, buying & selling, orders, and more. What can I help you with today?",
};

const QUICK_ACTIONS = [
  { label: "\ud83d\udc13 Browse Breeds", prompt: "What gamefowl breeds are available on BloodlinePH?" },
  { label: "\ud83d\udcb0 How to Buy", prompt: "How do I buy gamefowl on BloodlinePH?" },
  { label: "\ud83d\udce6 Track Order", prompt: "How do I track my order on BloodlinePH?" },
  { label: "\ud83c\udfea Become a Seller", prompt: "How do I become a seller on BloodlinePH?" },
];

export function ChatWidget() {
  const { accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch quota when chat opens
  useEffect(() => {
    if (!isOpen) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    fetch(`${apiUrl}/ai-chat/quota`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setQuota(data);
        setRateLimited(data.remaining === 0 && !data.isUnlimited);
      })
      .catch(() => {});
  }, [isOpen, accessToken]);

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || isTyping) return;

    setHasInteracted(true);
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const response = await fetch(`${apiUrl}/ai-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: newMessages }),
      });

      // Handle rate limit
      if (response.status === 429) {
        const err = await response.json();
        setIsTyping(false);
        setRateLimited(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: err.message || "You've reached your daily chat limit.",
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsTyping(false);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (separated by \n\n)
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          // Each event can have multiple lines; we care about data: lines
          const dataLines = rawEvent
            .split("\n")
            .filter((l) => l.startsWith("data: "))
            .map((l) => l.slice(6));
          const data = dataLines.join("\n");
          if (!data) continue;
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              aiMessage += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: aiMessage,
                };
                return updated;
              });
            }
            if (parsed.quota) {
              setQuota(parsed.quota);
              setRateLimited(
                parsed.quota.remaining === 0 && !parsed.quota.isUnlimited,
              );
            }
            if (parsed.error) {
              aiMessage = parsed.error;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: aiMessage,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col bg-white
            inset-0
            md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] md:rounded-2xl md:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white md:rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">
                  BloodlinePH Assistant
                </h3>
                <p className="text-[11px] text-red-100">
                  Ask me anything about gamefowl!
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {/* Quick Actions (show only if no user interaction yet) */}
            {!hasInteracted && (
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">AI</span>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input + Quota */}
          <div className="border-t border-gray-200 bg-white md:rounded-b-2xl">
            {/* Quota indicator */}
            {quota && !quota.isUnlimited && (
              <div className="px-4 pt-2 pb-0.5">
                <p
                  className={`text-[11px] ${
                    rateLimited
                      ? "text-red-600 font-medium"
                      : quota.remaining <= 3
                      ? "text-amber-600"
                      : "text-gray-400"
                  }`}
                >
                  {rateLimited
                    ? quota.isGuest
                      ? "\ud83d\udd12 Daily limit reached. Sign in for 100 messages/day!"
                      : "\ud83d\udd12 Daily limit reached. Resets at midnight."
                    : `\u2728 ${quota.remaining} of ${quota.limit} messages left today${
                        quota.isGuest ? " (sign in for more)" : ""
                      }`}
                </p>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-2.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  rateLimited
                    ? "Daily limit reached..."
                    : "Type your message..."
                }
                disabled={isTyping || rateLimited}
                className="flex-1 px-3.5 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || rateLimited}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 w-14 h-14 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 hover:shadow-xl transition-all flex items-center justify-center
            bottom-20 right-4
            md:bottom-6 md:right-6
            animate-pulse hover:animate-none"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
