"use client";

import { useState } from "react";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface IdentifyResult {
  likelyBreeds: Array<{ name: string; confidence: number }>;
  traits: string[];
  notes: string;
}

export default function BreedIdPage() {
  const { accessToken } = useAuth();
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState("");

  async function identify(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiPost<IdentifyResult>(
        "/ai-chat/identify-breed",
        { imageUrl: imageUrl.trim() },
        accessToken ?? undefined,
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Couldn't identify the breed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold">AI Breed Identifier</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a rooster photo URL and our AI will identify the likely breed
          based on plumage, build, and distinguishing features.
        </p>
      </div>

      {/* Input card */}
      <form
        onSubmit={identify}
        className="space-y-3 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-5"
      >
        <label className="block text-sm font-semibold text-gray-800">
          Rooster photo URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…/rooster.jpg"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading || !imageUrl.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 px-5 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Identify breed
              </>
            )}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-gray-600">
          Tip: paste a photo from any listing or your camera roll (uploaded to
          cloud).
        </p>
      </form>

      {/* Preview */}
      {imageUrl && (
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-h-96 w-full object-contain"
            onError={() => setError("Couldn't load image — check the URL.")}
          />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 rounded-xl border-2 border-primary/20 bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Likely Breeds
            </p>
            <div className="mt-2 space-y-2">
              {result.likelyBreeds.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      i === 0
                        ? "bg-gradient-to-br from-amber-400 to-red-500"
                        : "bg-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex flex-1 items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {b.name}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500"
                          style={{ width: `${b.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-gray-700">
                        {b.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.traits.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Key traits observed
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.traits.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 text-sm italic text-gray-700">{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
