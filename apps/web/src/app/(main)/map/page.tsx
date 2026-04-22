"use client";

import { SellersMap } from "@/components/map/sellers-map";

export default function MapPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Nearby Breeders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hanapin ang mga verified breeders sa buong Pilipinas. Tap a pin to
          see their farm details.
        </p>
      </div>
      <SellersMap />
    </div>
  );
}
