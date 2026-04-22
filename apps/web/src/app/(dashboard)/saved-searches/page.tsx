"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Trash2, Plus, Search } from "lucide-react";
import { useSavedSearches, summarizeSearch } from "@/lib/saved-searches";

export default function SavedSearchesPage() {
  const { searches, save, remove, toggleAlert } = useSavedSearches();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "",
    breed: "",
    minPrice: "",
    maxPrice: "",
    province: "",
    category: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    save({
      label: form.label.trim(),
      breed: form.breed || undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      province: form.province || undefined,
      category: form.category || undefined,
      alertsEnabled: true,
    });
    setShowForm(false);
    setForm({
      label: "",
      breed: "",
      minPrice: "",
      maxPrice: "",
      province: "",
      category: "",
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saved Searches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ipapadala namin sa'yo agad kapag may bagong listing na tugma sa
            iyong criteria.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4"
        >
          <p className="mb-3 text-sm font-semibold">New saved search</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Name (e.g. Kelso under ₱10k)"
              required
              className="rounded-lg border border-input px-3 py-2 text-sm"
            />
            <input
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              placeholder="Breed (e.g. Kelso)"
              className="rounded-lg border border-input px-3 py-2 text-sm"
            />
            <input
              value={form.minPrice}
              onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
              placeholder="Min price ₱"
              type="number"
              className="rounded-lg border border-input px-3 py-2 text-sm"
            />
            <input
              value={form.maxPrice}
              onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
              placeholder="Max price ₱"
              type="number"
              className="rounded-lg border border-input px-3 py-2 text-sm"
            />
            <input
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              placeholder="Province (e.g. Pampanga)"
              className="rounded-lg border border-input px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-input px-3 py-2 text-sm"
            >
              <option value="">Any category</option>
              <option value="rooster">Rooster</option>
              <option value="hen">Hen</option>
              <option value="stag">Stag</option>
              <option value="pullet">Pullet</option>
              <option value="pair">Pair</option>
              <option value="brood">Brood</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Save search
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {searches.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No saved searches yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Save a search and we'll alert you when matching listings appear.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {searches.map((s) => {
            const searchUrl = `/listings?${new URLSearchParams({
              ...(s.breed ? { breed: s.breed } : {}),
              ...(s.category ? { category: s.category } : {}),
              ...(s.minPrice ? { minPrice: String(s.minPrice) } : {}),
              ...(s.maxPrice ? { maxPrice: String(s.maxPrice) } : {}),
              ...(s.province ? { province: s.province } : {}),
            }).toString()}`;

            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    s.alertsEnabled ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s.alertsEnabled ? (
                    <Bell className="h-5 w-5" />
                  ) : (
                    <BellOff className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={searchUrl}
                    className="block truncate text-sm font-semibold hover:text-primary"
                  >
                    {s.label}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {summarizeSearch(s)}
                  </p>
                </div>
                <button
                  onClick={() => toggleAlert(s.id)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  title={s.alertsEnabled ? "Mute alerts" : "Enable alerts"}
                >
                  {s.alertsEnabled ? "Alerts on" : "Alerts off"}
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
