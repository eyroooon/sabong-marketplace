"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiUpload, apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function UploadVideoPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<"community" | "marketplace">("community");
  const [listingId, setListingId] = useState("");
  const [myListings, setMyListings] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/feed/upload");
    }
  }, [isAuthenticated, router]);

  // Fetch user's listings when marketplace type selected
  useEffect(() => {
    if (type === "marketplace" && accessToken) {
      apiGet<any>("/listings/my", accessToken)
        .then((res) => {
          const active = (res.data || []).filter(
            (l: any) => l.status === "active",
          );
          setMyListings(active);
        })
        .catch(() => setMyListings([]));
    }
  }, [type, accessToken]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 100 * 1024 * 1024) {
      setError("Video must be under 100MB");
      return;
    }

    setFile(selected);
    setError("");

    // Create preview URL
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !caption.trim()) return;
    setError("");
    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption.trim());
      formData.append("type", type);
      if (type === "marketplace" && listingId) {
        formData.append("listingId", listingId);
      }

      setProgress(30);

      await apiUpload("/videos", formData, accessToken!);

      setProgress(100);
      router.push("/feed");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Upload Video</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share a video of your gamefowl or farm with the community.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Video picker */}
        <div>
          <label className="mb-2 block text-sm font-medium">Video</label>
          {preview ? (
            <div className="relative">
              <video
                src={preview}
                className="w-full rounded-xl bg-black"
                style={{ maxHeight: 400 }}
                controls
                playsInline
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-input py-16 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <svg className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p className="mt-2 text-sm font-medium">Tap to select video</p>
              <p className="mt-1 text-xs">MP4, WebM, or MOV — max 100MB</p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Caption */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe your video..."
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {caption.length}/500
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="mb-2 block text-sm font-medium">Video Type</label>
          <div className="flex gap-3">
            <label
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 ${
                type === "community"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="type"
                value="community"
                checked={type === "community"}
                onChange={() => setType("community")}
                className="sr-only"
              />
              <span className="text-sm font-medium">Community</span>
            </label>
            <label
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 ${
                type === "marketplace"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="type"
                value="marketplace"
                checked={type === "marketplace"}
                onChange={() => setType("marketplace")}
                className="sr-only"
              />
              <span className="text-sm font-medium">Marketplace</span>
            </label>
          </div>
        </div>

        {/* Listing selector (marketplace only) */}
        {type === "marketplace" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Link to Listing
            </label>
            {myListings.length > 0 ? (
              <select
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              >
                <option value="">Select a listing</option>
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} — ₱{Number(l.price).toLocaleString()}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">
                You have no active listings. Create one first.
              </p>
            )}
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || !caption.trim() || uploading}
          className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Post Video"}
        </button>
      </form>
    </div>
  );
}
