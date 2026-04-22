"use client";

import { ShieldCheck, Award, Clock, Star, MessageSquare } from "lucide-react";

interface TrustScoreProps {
  verificationStatus?: string;
  totalSales?: number;
  avgRating?: string | number;
  responseRate?: string | number;
  responseTime?: number;
}

/**
 * Composite seller trust score 0-100 based on verification,
 * sales volume, average rating, response rate, response time.
 * Weights pull from industry norms for 2-sided marketplaces.
 */
function computeScore(p: TrustScoreProps): number {
  let score = 0;

  // Verification: 25 pts
  if (p.verificationStatus === "verified") score += 25;
  else if (p.verificationStatus === "pending") score += 10;

  // Avg rating: 30 pts (linear from 0 to 5 stars)
  const rating = Number(p.avgRating ?? 0);
  score += Math.min(30, (rating / 5) * 30);

  // Sales volume: 20 pts (capped at 50 sales = full)
  const sales = p.totalSales ?? 0;
  score += Math.min(20, (sales / 50) * 20);

  // Response rate: 15 pts
  const rr = Number(p.responseRate ?? 0);
  score += Math.min(15, (rr / 100) * 15);

  // Response time: 10 pts (faster = better, cap at 60min → 0, <5min → full)
  const rt = p.responseTime ?? 0;
  if (rt > 0) {
    const norm = Math.max(0, Math.min(1, 1 - (rt - 5) / 55));
    score += norm * 10;
  }

  return Math.round(score);
}

function tier(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 85)
    return {
      label: "Elite",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  if (score >= 70)
    return {
      label: "Trusted",
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    };
  if (score >= 50)
    return {
      label: "Growing",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  return {
    label: "New",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };
}

export function TrustScore(p: TrustScoreProps) {
  const score = computeScore(p);
  const t = tier(score);

  return (
    <div className={`rounded-xl border p-4 ${t.bg} ${t.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${t.color}`} />
          <p className={`text-xs font-bold uppercase tracking-wide ${t.color}`}>
            Trust Score
          </p>
        </div>
        <span
          className={`rounded-full bg-white px-2 py-0.5 text-[11px] font-bold ${t.color}`}
        >
          {t.label}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-4xl font-black tabular-nums ${t.color}`}>
          {score}
        </span>
        <span className="text-sm text-gray-500">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 70
              ? "bg-green-500"
              : score >= 50
                ? "bg-amber-500"
                : "bg-gray-400"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Component breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <Pill
          icon={<Award className="h-3 w-3" />}
          label="Verified"
          on={p.verificationStatus === "verified"}
        />
        <Pill
          icon={<Star className="h-3 w-3" />}
          label={`${Number(p.avgRating ?? 0).toFixed(1)}★ rating`}
          on={Number(p.avgRating ?? 0) > 0}
        />
        <Pill
          icon={<MessageSquare className="h-3 w-3" />}
          label={`${Math.round(Number(p.responseRate ?? 0))}% reply rate`}
          on={Number(p.responseRate ?? 0) >= 80}
        />
        <Pill
          icon={<Clock className="h-3 w-3" />}
          label={p.responseTime ? `~${p.responseTime}m reply` : "—"}
          on={(p.responseTime ?? 0) > 0 && (p.responseTime ?? 0) <= 30}
        />
      </div>
    </div>
  );
}

function Pill({
  icon,
  label,
  on,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md px-2 py-1 ${
        on ? "bg-white text-gray-800" : "bg-white/50 text-gray-400"
      }`}
    >
      {icon}
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}
