"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiUpload } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, BREEDS } from "@sabong/shared";

export default function CreateListingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
  });

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - selectedFiles.length);
    if (newFiles.length === 0) return;

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    // Generate previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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

      const result = await apiPost<{ id: string }>("/listings", body, accessToken!);

      // Upload images if any were selected
      if (selectedFiles.length > 0 && result.id) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        await apiUpload(`/listings/${result.id}/images`, formData, accessToken!);
      }

      router.push("/sell");
    } catch (err: any) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Create New Listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the details about your gamefowl.
      </p>

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
            Add up to 5 photos. The first photo will be the cover image.
          </p>

          {/* Drag & drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-input p-6 text-center transition-colors hover:border-primary hover:bg-muted/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-10 w-10 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium">
              {selectedFiles.length >= 5
                ? "Maximum 5 photos reached"
                : "Click or drag photos here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, or WebP. Max 5MB each.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
              disabled={selectedFiles.length >= 5}
            />
          </div>

          {/* Thumbnails */}
          {previews.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white hover:bg-destructive/80"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Basic Info */}
        <section>
          <h2 className="mb-3 font-semibold">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Premium Kelso Stag - 8 months"
                className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
                minLength={5}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your gamefowl in detail..."
                rows={4}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
                minLength={20}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Breed</label>
                <select
                  value={form.breed}
                  onChange={(e) => updateField("breed", e.target.value)}
                  className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                >
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
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-input px-6 py-2.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
