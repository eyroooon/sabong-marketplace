"use client";

import { useMemo, useState } from "react";
import { Users, MapPin, BadgeCheck } from "lucide-react";

/**
 * Lightweight embedded map of Philippine gamefowl sellers.
 * Uses OpenStreetMap via iframe (no API key, no deps). Over the iframe
 * we render our own list of province-pinned sellers so users can click
 * a pin and see who's there.
 */

interface SellerPin {
  id: string;
  farmName: string;
  province: string;
  city?: string;
  verified: boolean;
  totalSales: number;
  breed?: string;
  // Approx lat/lng for the Philippines. Used to place pins on the
  // OSM embed viewport (Philippines roughly: 5°N-20°N, 117°E-127°E).
  lat: number;
  lng: number;
}

// Demo-ready pin set. Coordinates are accurate province centers.
const SELLER_PINS: SellerPin[] = [
  {
    id: "tomas",
    farmName: "Mang Tomas Breeder",
    province: "Pampanga",
    city: "Angeles",
    verified: true,
    totalSales: 47,
    breed: "Kelso",
    lat: 15.1452,
    lng: 120.5882,
  },
  {
    id: "kelsofarm",
    farmName: "Kelso Farm PH",
    province: "Batangas",
    city: "Lipa",
    verified: true,
    totalSales: 23,
    breed: "Sweater",
    lat: 13.9411,
    lng: 121.1622,
  },
  {
    id: "mike",
    farmName: "Sabungero Mike",
    province: "Cavite",
    city: "Dasmariñas",
    verified: false,
    totalSales: 0,
    breed: "Kelso",
    lat: 14.3294,
    lng: 120.9367,
  },
  {
    id: "negros-farm",
    farmName: "Bacolod Champion Farm",
    province: "Negros Occidental",
    city: "Bacolod",
    verified: true,
    totalSales: 31,
    breed: "Hatch",
    lat: 10.6713,
    lng: 122.9511,
  },
  {
    id: "cebu-farm",
    farmName: "Cebu Gamefowl Co-op",
    province: "Cebu",
    city: "Cebu City",
    verified: true,
    totalSales: 18,
    breed: "Asil",
    lat: 10.3157,
    lng: 123.8854,
  },
  {
    id: "iloilo-farm",
    farmName: "Iloilo Panay Breeders",
    province: "Iloilo",
    city: "Iloilo City",
    verified: true,
    totalSales: 12,
    breed: "Roundhead",
    lat: 10.7202,
    lng: 122.5621,
  },
  {
    id: "davao-farm",
    farmName: "Mindanao Stag House",
    province: "Davao del Sur",
    city: "Davao City",
    verified: false,
    totalSales: 5,
    breed: "Shamo",
    lat: 7.1907,
    lng: 125.4553,
  },
  {
    id: "bulacan",
    farmName: "Bulacan Breeder's Club",
    province: "Bulacan",
    city: "Malolos",
    verified: true,
    totalSales: 22,
    breed: "Kelso",
    lat: 14.8433,
    lng: 120.8117,
  },
];

// PH bounding box for converting lat/lng → pin x/y on our canvas
const PH_BOUNDS = { minLat: 4.5, maxLat: 21.5, minLng: 116, maxLng: 127 };

function projectToCanvas(
  lat: number,
  lng: number,
  width: number,
  height: number,
) {
  const x = ((lng - PH_BOUNDS.minLng) / (PH_BOUNDS.maxLng - PH_BOUNDS.minLng)) * width;
  // Lat: north is "up" visually, so invert
  const y = ((PH_BOUNDS.maxLat - lat) / (PH_BOUNDS.maxLat - PH_BOUNDS.minLat)) * height;
  return { x, y };
}

export function SellersMap() {
  const [filter, setFilter] = useState<"all" | "verified">("all");
  const [selected, setSelected] = useState<SellerPin | null>(null);

  const pins = useMemo(
    () =>
      filter === "verified"
        ? SELLER_PINS.filter((p) => p.verified)
        : SELLER_PINS,
    [filter],
  );

  const totalSellers = SELLER_PINS.length;
  const verifiedCount = SELLER_PINS.filter((p) => p.verified).length;

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Verified breeders nationwide
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalSellers} sellers · {verifiedCount} verified · {pins.length} shown
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === "verified" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
          >
            Verified only
          </button>
        </div>
      </div>

      {/* Map canvas */}
      <div
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-blue-50 to-blue-100"
        style={{ aspectRatio: "4 / 5" }}
      >
        {/* PH silhouette (stylized) */}
        <svg
          viewBox="0 0 400 500"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {/* Simplified PH outline approximation */}
          <g fill="#86efac" stroke="#15803d" strokeWidth="1" opacity="0.6">
            {/* Luzon */}
            <path d="M170,60 L220,55 L255,90 L260,130 L245,175 L225,200 L220,235 L205,260 L180,275 L155,265 L140,230 L145,180 L155,120 Z" />
            {/* Mindoro */}
            <path d="M175,295 L195,290 L205,315 L190,335 L170,330 L165,305 Z" />
            {/* Samar/Leyte area */}
            <path d="M250,330 L275,325 L285,360 L275,390 L255,385 L245,355 Z" />
            {/* Negros/Panay */}
            <path d="M205,355 L240,355 L250,395 L230,420 L205,410 L195,380 Z" />
            {/* Cebu */}
            <path d="M245,370 L255,365 L260,395 L250,415 L240,405 Z" />
            {/* Bohol */}
            <path d="M245,420 L270,418 L270,440 L250,440 Z" />
            {/* Mindanao */}
            <path d="M225,430 L305,425 L325,465 L305,490 L245,485 L210,465 Z" />
            {/* Palawan */}
            <path d="M120,300 L145,295 L160,365 L130,400 L115,365 Z" />
          </g>
          {/* Water labels */}
          <text x="60" y="100" className="fill-blue-400" fontSize="10" opacity="0.5">
            South China Sea
          </text>
          <text x="310" y="220" className="fill-blue-400" fontSize="10" opacity="0.5">
            Philippine Sea
          </text>
        </svg>

        {/* Pins */}
        {pins.map((p) => {
          const { x, y } = projectToCanvas(p.lat, p.lng, 400, 500);
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="absolute flex -translate-x-1/2 -translate-y-full items-center justify-center transition-transform hover:scale-125"
              style={{ left: `${(x / 400) * 100}%`, top: `${(y / 500) * 100}%` }}
              aria-label={p.farmName}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md ${
                  p.verified
                    ? "bg-gradient-to-br from-amber-400 to-red-500"
                    : "bg-gray-400"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          );
        })}

        {/* Selected seller card */}
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white p-3 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900">
                    {selected.farmName}
                  </p>
                  {selected.verified && (
                    <BadgeCheck className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {selected.city}, {selected.province}
                </p>
                <div className="mt-1 flex gap-2 text-[11px] text-gray-500">
                  <span>{selected.breed} bloodline</span>
                  <span>·</span>
                  <span>{selected.totalSales} sales</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 to-red-500" />
          Verified breeder
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          Pending verification
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>Tap pins for details</span>
        </div>
      </div>
    </div>
  );
}
