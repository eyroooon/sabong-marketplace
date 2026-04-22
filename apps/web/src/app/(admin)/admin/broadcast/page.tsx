"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { Megaphone, Send } from "lucide-react";

type Audience = "all" | "buyers" | "sellers" | "verified_sellers";

const AUDIENCE_LABELS: Record<Audience, { label: string; sub: string }> = {
  all: { label: "All users", sub: "Everyone except admins" },
  buyers: { label: "Buyers only", sub: "Accounts with buyer role" },
  sellers: { label: "Sellers only", sub: "Accounts with seller role (any status)" },
  verified_sellers: {
    label: "Verified sellers",
    sub: "Only sellers with approved verification",
  },
};

export default function BroadcastPage() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; audience: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSending(true);
    setResult(null);
    try {
      const res = await apiPost<{ sent: number; audience: string }>(
        "/admin/broadcast",
        { title: title.trim(), body: body.trim(), audience },
        accessToken,
      );
      setResult(res);
      setTitle("");
      setBody("");
    } catch (err: any) {
      alert(err.message || "Broadcast failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Broadcast notification
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Send an in-app notification to a segment of users. They'll see it
          in their bell instantly.
        </p>
      </div>

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Broadcast sent!</p>
          <p>
            Delivered to <strong>{result.sent}</strong> user
            {result.sent !== 1 && "s"} (
            {AUDIENCE_LABELS[result.audience as Audience]?.label ?? result.audience}
            ).
          </p>
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">New announcement</p>
            <p className="text-xs text-gray-500">
              Keep messages clear and short.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Weekend promo — libre featured listings!"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {title.length}/120
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={500}
            required
            placeholder="Your message in Tagalog, English, or Taglish…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {body.length}/500
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Audience
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((key) => {
              const selected = audience === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAudience(key)}
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      selected ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {AUDIENCE_LABELS[key].label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {AUDIENCE_LABELS[key].sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={sending || !title.trim() || !body.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Broadcast now"}
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">Preview</p>
        <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-white">
            🐓
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-gray-900">
              {title || "(Your subject will appear here)"}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-gray-700">
              {body || "(Your message will appear here)"}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">BloodlinePH • just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
