"use client";

import { useEffect, useState } from "react";
import { Shield, Users, Package } from "lucide-react";

/**
 * Landing page live counter — shows escrow protected volume,
 * sellers onboarded, and listings live. Numbers tick up every 2-4s
 * to give the landing page a sense of ongoing platform activity.
 *
 * Values are seeded with plausible demo numbers. In production,
 * swap the initial values for a GET /api/public/stats call.
 */
export function LiveCounter() {
  const [escrowPHP, setEscrowPHP] = useState(87_450);
  const [sellers, setSellers] = useState(142);
  const [listings, setListings] = useState(384);

  useEffect(() => {
    // Escrow: biggest bumps, happens ~every 3-6s
    const escrowTimer = setInterval(
      () => {
        setEscrowPHP((v) => v + Math.floor(400 + Math.random() * 1200));
      },
      3000 + Math.random() * 3000,
    );

    // Sellers: smaller bumps, happens ~every 8-14s
    const sellersTimer = setInterval(
      () => {
        setSellers((v) => v + 1);
      },
      8000 + Math.random() * 6000,
    );

    // Listings: medium, happens ~every 5-9s
    const listingsTimer = setInterval(
      () => {
        setListings((v) => v + 1);
      },
      5000 + Math.random() * 4000,
    );

    return () => {
      clearInterval(escrowTimer);
      clearInterval(sellersTimer);
      clearInterval(listingsTimer);
    };
  }, []);

  return (
    <div className="fade-up-delay-3 mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-3 md:gap-6">
      <CounterCard
        icon={<Shield className="h-4 w-4 text-emerald-400" />}
        label="Escrow Protected"
        valueText={`₱${escrowPHP.toLocaleString("en-PH")}`}
        sublabel="this week"
        accent="text-emerald-400"
      />
      <CounterCard
        icon={<Users className="h-4 w-4 text-[#fbbf24]" />}
        label="Verified Breeders"
        valueText={sellers.toLocaleString("en-PH")}
        sublabel="and growing"
        accent="text-[#fbbf24]"
      />
      <CounterCard
        icon={<Package className="h-4 w-4 text-red-400" />}
        label="Active Listings"
        valueText={listings.toLocaleString("en-PH")}
        sublabel="across PH"
        accent="text-red-400"
      />
    </div>
  );
}

function CounterCard({
  icon,
  label,
  valueText,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  valueText: string;
  sublabel: string;
  accent: string;
}) {
  return (
    <div className="glass-strong rounded-2xl border border-white/10 p-4 md:p-5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 md:text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`mt-2 text-xl font-black tabular-nums leading-tight md:text-3xl ${accent}`}
      >
        {valueText}
      </div>
      <div className="mt-1 text-[10px] text-white/50 md:text-xs">
        {sublabel}
      </div>
    </div>
  );
}
