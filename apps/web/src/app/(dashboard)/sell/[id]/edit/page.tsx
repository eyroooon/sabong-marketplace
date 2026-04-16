"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiGet, apiPatch, apiPost, apiDelete, apiUpload } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, BREEDS } from "@sabong/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_HOST = API_URL.replace(/\/api\/?$/, "");

function resolveImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? `${API_HOST}${url}` : `${API_HOST}/${url}`;
}

interface ListingImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listingStatus, setListingStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing images from the server
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  // New files to upload
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    breed: "",
    bloodline: "",
    ageMonths: "",
    weightKg: "",
    color: "",
    legColor: "",
    fightingStyle: "",
    sireInfo: "",
    damInfo: "",
    vaccinationStatus: "",
    price: "",
    priceType: "fixed",
    locationProvince: "",
    locationCity: "",
    shippingAvailable: false,
    shippingAreas: "local",
    shippingFee: "",
    shippingRequired: true,
  });

  useEffect(() => {
    if (!params.id || !accessToken) return;

    // Fetch listing from my listings (we have the ID)
    apiGet("/listings/my", accessToken)
      .then((res: any) => {
        const listing = (res.data || []).find((l: any) => l.id === params.id);
        if (!listing) {
          setError("Listing not found or you don't have permission to edit it.");
          setLoading(false);
          return;
        }
        setListingStatus(listing.status);
        setForm({
          title: listing.title || "",
          description: listing.description || "",
          category: listing.category || "",
          breed: listing.breed || "",
          bloodline: listing.bloodline || "",
          ageMonths: listing.ageMonths?.toString() || "",
          weightKg: listing.weightKg?.toString() || "",
          color: listing.color || "",
          legColor: listing.legColor || "",
          fightingStyle: listing.fightingStyle || "",
          sireInfo: listing.sireInfo || "",
          damInfo: listing.damInfo || "",
          vaccinationStatus: listing.vaccinationStatus || "",
          price: listing.price?.toString() || "",
          priceType: listing.priceType || "fixed",
          locationProvince: listing.locationProvince || "",
          locationCity: listing.locationCity || "",
          shippingAvailable: listing.shippingAvailable ?? false,
          shippingAreas: listing.shippingAreas || "local",
          shippingFee: listing.shippingFee?.toString() || "",
          shippingRequired: true,
        });

        // Load existing images by fetching the listing by slug
        if (listing.slug) {
          apiGet(`/listings/${listing.slug}`)
            .then((detail: any) => {
              if (detail.images) {
                setExistingImages(detail.images);
              }
            })
            .catch(() => {
              // Images will just be empty
            });
        }

        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load listing");
        setLoading(false);
      });
  }, [params.id, accessToken]);

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const totalImages = existingImages.length + newFiles.length;

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const maxNew = 5 - totalImages;
    const added = Array.from(files).slice(0, maxNew);
    if (added.length === 0) return;

    setNewFiles((prev) => [...prev, ...added]);
    const urls = added.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...urls]);
  }

  function removeNewFile(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function removeExistingImage(imageId: string) {
    try {
      await apiDelete(`/listings/${params.id}/images/${imageId}`, accessToken!);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      setError(err.message || "Failed to delete image");
    }
  }

  async function uploadNewImages() {
    if (newFiles.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      newFiles.forEach((file) => {
        formData.append("images", file);
      });
      const result = await apiUpload<{ images: ListingImage[] }>(
        `/listings/${params.id}/images`,
        formData,
        accessToken!,
      );
      setExistingImages((prev) => [...prev, ...(result.images || [])]);
      // Clear new files
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setNewPreviews([]);
    } catch (err: any) {
      setError(err.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const body: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        priceType: form.priceType,
        locationProvince: form.locationProvince,
        locationCity: form.locationCity,
        shippingAvailable: true,
        shippingAreas: form.shippingAreas,
      };

      if (form.breed) body.breed = form.breed;
      if (form.bloodline) body.bloodline = form.bloodline;
      if (form.ageMonths) body.ageMonths = Number(form.ageMonths);
      if (form.weightKg) body.weightKg = Number(form.weightKg);
      if (form.color) body.color = form.color;
      if (form.legColor) body.legColor = form.legColor;
      if (form.fightingStyle) body.fightingStyle = form.fightingStyle;
      if (form.sireInfo) body.sireInfo = form.sireInfo;
      if (form.damInfo) body.damInfo = form.damInfo;
      if (form.vaccinationStatus) body.vaccinationStatus = form.vaccinationStatus;
      if (form.shippingFee) body.shippingFee = Number(form.shippingFee);

      await apiPatch(`/listings/${params.id}`, body, accessToken!);

      // Upload new images if any
      if (newFiles.length > 0) {
        await uploadNewImages();
      }

      router.push("/sell");
    } catch (err: any) {
      setError(err.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      await apiPost(`/listings/${params.id}/publish`, {}, accessToken!);
      router.push("/sell");
    } catch (err: any) {
      setError(err.message || "Failed to publish listing");
    }
  }

  async function handleArchive() {
    try {
      await apiPost(`/listings/${params.id}/archive`, {}, accessToken!);
      router.push("/sell");
    } catch (err: any) {
      setError(err.message || "Failed to archive listing");
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your listing details.
          </p>
        </div>
        <div className="flex gap-2">
          {listingStatus === "draft" && (
            <button
              onClick={handlePublish}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Publish
            </button>
          )}
          {listingStatus === "active" && (
            <button
              onClick={handleArchive}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Photos */}
        <section>
          <h2 className="mb-3 font-semibold">Photos</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Up to 5 photos. The first photo is the cover image.
          </p>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {existingImages.map((img, i) => (
                <div key={img.id} className="relative">
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={`Image ${i + 1}`}
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white hover:bg-destructive/80"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New file previews */}
          {newPreviews.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative">
                  <img
                    src={src}
                    alt={`New ${i + 1}`}
                    className="h-24 w-24 rounded-lg border-2 border-dashed border-primary object-cover"
                  />
                  <span className="absolute left-1 top-1 rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white hover:bg-destructive/80"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {totalImages < 5 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-input p-6 text-center transition-colors hover:border-primary hover:bg-muted/50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="mt-2 text-sm font-medium">Add more photos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {5 - totalImages} remaining. JPG, PNG, or WebP. Max 5MB each.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </section>

        {/* Basic Info */}
        <section>
          <h2 className="mb-3 font-semibold">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title *</label>
              <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Premium Kelso Stag - 8 months" className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required minLength={5} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description *</label>
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe your gamefowl in detail..." rows={4} className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required minLength={20} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Category *</label>
                <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm" required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Breed</label>
                <select value={form.breed} onChange={(e) => updateField("breed", e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
                  <option value="">Select breed</option>
                  {BREEDS.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Gamefowl Details */}
        <section>
          <h2 className="mb-3 font-semibold">Gamefowl Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bloodline</label>
              <input type="text" value={form.bloodline} onChange={(e) => updateField("bloodline", e.target.value)} placeholder="e.g. Lemon 84" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Age (months)</label>
              <input type="number" value={form.ageMonths} onChange={(e) => updateField("ageMonths", e.target.value)} placeholder="8" min={0} max={120} className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Weight (kg)</label>
              <input type="number" value={form.weightKg} onChange={(e) => updateField("weightKg", e.target.value)} placeholder="2.1" step="0.1" min={0} max={20} className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Color</label>
              <input type="text" value={form.color} onChange={(e) => updateField("color", e.target.value)} placeholder="Red" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Leg Color</label>
              <input type="text" value={form.legColor} onChange={(e) => updateField("legColor", e.target.value)} placeholder="Yellow" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fighting Style</label>
              <input type="text" value={form.fightingStyle} onChange={(e) => updateField("fightingStyle", e.target.value)} placeholder="Cutter" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* Lineage */}
        <section>
          <h2 className="mb-3 font-semibold">Lineage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sire (Father)</label>
              <input type="text" value={form.sireInfo} onChange={(e) => updateField("sireInfo", e.target.value)} placeholder="Father info" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dam (Mother)</label>
              <input type="text" value={form.damInfo} onChange={(e) => updateField("damInfo", e.target.value)} placeholder="Mother info" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="mb-3 font-semibold">Pricing & Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price (PHP) *</label>
              <input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="15000" min={1} className="w-full rounded-lg border border-input px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price Type</label>
              <select value={form.priceType} onChange={(e) => updateField("priceType", e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable</option>
                <option value="auction">Auction</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Province *</label>
              <input type="text" value={form.locationProvince} onChange={(e) => updateField("locationProvince", e.target.value)} placeholder="Bulacan" className="w-full rounded-lg border border-input px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">City *</label>
              <input type="text" value={form.locationCity} onChange={(e) => updateField("locationCity", e.target.value)} placeholder="Meycauayan" className="w-full rounded-lg border border-input px-3 py-2 text-sm" required />
            </div>
          </div>
        </section>

        {/* Shipping */}
        <section>
          <h2 className="mb-3 font-semibold">Shipping</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.shippingAvailable} onChange={(e) => updateField("shippingAvailable", e.target.checked)} className="rounded" />
              <span className="text-sm">Shipping available</span>
            </label>
            {form.shippingAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Shipping Fee (PHP)</label>
                  <input type="number" value={form.shippingFee} onChange={(e) => updateField("shippingFee", e.target.value)} placeholder="500" className="w-full rounded-lg border border-input px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Shipping Area</label>
                  <select value={form.shippingAreas} onChange={(e) => updateField("shippingAreas", e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
                    <option value="local">Local only</option>
                    <option value="regional">Regional</option>
                    <option value="nationwide">Nationwide</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="flex gap-3 border-t border-border pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/sell")}
            className="rounded-lg border border-input px-6 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
