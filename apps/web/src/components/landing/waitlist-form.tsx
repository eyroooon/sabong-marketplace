"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface WaitlistFormProps {
  source?: string;
}

export function WaitlistForm({ source = "landing" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed");

      // Local cache so returning visitors see confirmed state
      try {
        const existing: string[] = JSON.parse(
          localStorage.getItem("sabong-waitlist") || "[]"
        );
        if (!existing.includes(email)) existing.push(email);
        localStorage.setItem("sabong-waitlist", JSON.stringify(existing));
      } catch {}

      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "May nangyaring problema. Subukan ulit."
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-5 text-emerald-300">
        <div className="flex items-center gap-3">
          <Check className="h-5 w-5" />
          <span className="font-bold">Salamat! Naka-list ka na.</span>
        </div>
        <p className="text-center text-sm text-emerald-200/80">
          Abangan mo ang welcome email namin sa inbox mo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md" id="waitlist">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ikaw@email.com"
          autoComplete="email"
          className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 focus:border-[#fbbf24] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="shimmer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#dc2626] px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Sumali Na"
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-red-400">{error}</p>
      )}
      <p className="mt-3 text-center text-xs text-white/50">
        Walang spam. Walang credit card. Sabihin lang sa'yo pag ready ang mobile app.
      </p>
    </form>
  );
}
