"use client";

import { useEffect, useState } from "react";
import { Gavel, Flame } from "lucide-react";

/**
 * Live countdown for auction-type listings. Ends at `endsAt` (ISO or Date).
 * If the listing doesn't have a real end time, we default to +48h.
 */
export function AuctionCountdown({ endsAt }: { endsAt?: string | Date }) {
  const target = endsAt
    ? new Date(endsAt).getTime()
    : Date.now() + 48 * 60 * 60 * 1000;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const remaining = Math.max(0, target - now);
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining / (1000 * 60)) % 60);
  const s = Math.floor((remaining / 1000) % 60);

  const ending = remaining < 60 * 60 * 1000; // less than 1h

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-4 ${
        ending
          ? "border-red-300 bg-red-50 animate-pulse"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          ending ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        {ending ? <Flame className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${ending ? "text-red-700" : "text-amber-700"}`}
        >
          {ending ? "Ending soon!" : "Live auction"}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <TimeBlock value={h} label="h" />
          <span className="text-xl font-black text-gray-400">:</span>
          <TimeBlock value={m} label="m" />
          <span className="text-xl font-black text-gray-400">:</span>
          <TimeBlock value={s} label="s" />
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-2xl font-black tabular-nums text-gray-900">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-semibold text-gray-500">{label}</span>
    </div>
  );
}
