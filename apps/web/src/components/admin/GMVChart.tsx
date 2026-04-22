"use client";

import { TrendingUp } from "lucide-react";

const GMV_DATA = [
  12_000, 15_500, 14_200, 18_800, 21_300, 24_500, 23_100, 26_400, 28_200, 25_800,
  29_400, 32_100, 30_500, 33_200, 35_800, 34_100, 36_500, 38_200, 40_100, 42_800,
  41_200, 39_800, 42_500, 44_100, 43_600, 41_900, 43_800, 44_200, 43_100, 42_450,
];

export function GMVChart() {
  const max = Math.max(...GMV_DATA);
  const min = Math.min(...GMV_DATA);
  const width = 280;
  const height = 60;
  const points = GMV_DATA.map((v, i) => {
    const x = (i / (GMV_DATA.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(" ");

  const total = GMV_DATA.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Gross Merchandise Volume
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
          <TrendingUp className="h-3 w-3" /> +12.3% vs last mo
        </span>
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums text-gray-900">
        ₱{(total / 1000).toFixed(1)}k
      </p>
      <p className="text-xs text-gray-500">Last 30 days</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-16 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#gmvFill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
