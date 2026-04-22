import Link from "next/link";
import { Crown, Star } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";

/**
 * "Breeder of the Month" marketing banner rendered above the listings grid.
 * Uses hard-coded demo data for now.
 */
export function BreederOfMonth() {
  const name = "Mang Tomas Breeder";
  const stats = "47 sales · 4.8\u2605 rating · Verified 15+ years";
  const href = "/listings/kelso-stag-champion-bloodline";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-red-50 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-red-950/40">
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-6">
        {/* Left: avatar */}
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-3xl font-bold text-white shadow-md ring-4 ring-white dark:ring-neutral-900">
            {name.charAt(0)}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm ring-2 ring-white dark:ring-neutral-900">
            <Crown className="h-4 w-4" />
          </span>
        </div>

        {/* Middle: labels + copy */}
        <div className="flex-1 text-center sm:text-left">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Star className="h-3 w-3 fill-current" />
            Breeder of the Month
          </p>
          <h2 className="mt-1 flex items-center justify-center gap-1.5 text-xl font-bold sm:justify-start">
            <span>{name}</span>
            <VerifiedBadge size="md" />
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{stats}</p>
        </div>

        {/* Right: CTA */}
        <div className="shrink-0">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md"
          >
            View Farm
          </Link>
        </div>
      </div>
    </div>
  );
}
