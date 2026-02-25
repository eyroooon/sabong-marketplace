"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, BREEDS } from "@sabong/shared";

export default function CreateListingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    meetupAvailable: true,
  });

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        shippingAvailable: form.shippingAvailable,
        shippingAreas: form.shippingAreas,
        meetupAvailable: form.meetupAvailable,
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

      await apiPost("/listings", body, accessToken!);
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

            <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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

        {/* Delivery */}
        <section>
          <h2 className="mb-3 font-semibold">Delivery Options</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.meetupAvailable} onChange={(e) => updateField("meetupAvailable", e.target.checked)} className="rounded" />
              <span className="text-sm">Meetup available</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.shippingAvailable} onChange={(e) => updateField("shippingAvailable", e.target.checked)} className="rounded" />
              <span className="text-sm">Shipping available</span>
            </label>
            {form.shippingAvailable && (
              <div className="grid grid-cols-2 gap-4 pl-6">
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
