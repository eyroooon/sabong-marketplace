"use client";

import { useEffect, useState } from "react";
import { Activity, UserPlus, ShoppingCart, Heart, MessageSquare, Star, Package, CheckCircle2 } from "lucide-react";

type TickerEvent = {
  id: string;
  icon: "signup" | "order" | "like" | "message" | "review" | "listing" | "verified";
  message: string;
  location?: string;
  amount?: number;
  at: number;
};

/**
 * Deterministic-feeling but rotating list of activity events.
 * Mixes real names (from demo seed) with plausible cities + amounts
 * so the ticker always looks alive, even with small amounts of real
 * activity. One new event rotates in every 4-6 seconds.
 */
const DEMO_EVENTS: Omit<TickerEvent, "id" | "at">[] = [
  { icon: "signup", message: "Reylyn Cruz joined", location: "Davao City" },
  { icon: "order", message: "New order placed by Pedro Santos", location: "Cebu City", amount: 9525 },
  { icon: "listing", message: "Mang Tomas Breeder posted a Kelso stag", location: "Angeles" },
  { icon: "verified", message: "Sabungero Mike's Farm got verified", location: "Cavite" },
  { icon: "review", message: "Kelso Farm PH received a 5-star review", location: "Batangas" },
  { icon: "order", message: "Escrow released — ₱8,790 to Kelso Farm PH", amount: 8790 },
  { icon: "signup", message: "New buyer from Iloilo joined", location: "Iloilo" },
  { icon: "like", message: "Tomas' Kelso showcase hit 500 likes" },
  { icon: "message", message: "Pedro messaged Mang Tomas about a Stag" },
  { icon: "order", message: "Order shipped via LBC — SM-2026000003", location: "Manila → Cebu" },
  { icon: "listing", message: "Kelso Farm PH posted an Asil import", location: "Lipa" },
  { icon: "signup", message: "New seller from Pampanga joined", location: "Pampanga" },
  { icon: "review", message: "Mang Tomas earned +1 star in rating", location: "Angeles" },
  { icon: "order", message: "Payment confirmed — ₱12,600 via GCash", amount: 12600 },
  { icon: "verified", message: "New breeder verification submitted", location: "Bulacan" },
  { icon: "like", message: "Feeding routine video hit 1,000 likes" },
  { icon: "message", message: "Reylyn opened a chat with Kelso Farm PH" },
  { icon: "listing", message: "Mang Tomas listed a Hatch Pair", location: "Angeles" },
];

const ICONS = {
  signup: { component: UserPlus, bg: "bg-blue-100", fg: "text-blue-600" },
  order: { component: ShoppingCart, bg: "bg-green-100", fg: "text-green-600" },
  like: { component: Heart, bg: "bg-pink-100", fg: "text-pink-600" },
  message: { component: MessageSquare, bg: "bg-purple-100", fg: "text-purple-600" },
  review: { component: Star, bg: "bg-amber-100", fg: "text-amber-600" },
  listing: { component: Package, bg: "bg-indigo-100", fg: "text-indigo-600" },
  verified: { component: CheckCircle2, bg: "bg-emerald-100", fg: "text-emerald-600" },
};

function formatSecondsAgo(at: number) {
  const secs = Math.floor((Date.now() - at) / 1000);
  if (secs < 2) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export function LiveActivityTicker() {
  const [events, setEvents] = useState<TickerEvent[]>(() => {
    // Seed with a rolling window so it doesn't look empty on first render
    const now = Date.now();
    return [0, 1, 2, 3].map((i) => ({
      ...DEMO_EVENTS[i],
      id: `seed-${i}`,
      at: now - i * 12_000,
    }));
  });
  const [, setTick] = useState(0);

  // Add a new event every 4-7 seconds (randomized so it feels organic)
  useEffect(() => {
    let idx = 4;
    const schedule = () => {
      const delay = 4000 + Math.random() * 3000;
      return setTimeout(() => {
        const template = DEMO_EVENTS[idx % DEMO_EVENTS.length];
        idx += 1;
        setEvents((prev) => {
          const next: TickerEvent = {
            ...template,
            id: `evt-${idx}-${Date.now()}`,
            at: Date.now(),
          };
          return [next, ...prev].slice(0, 6);
        });
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, []);

  // Tick every second so "Xs ago" labels stay fresh
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">
            Live activity
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Activity className="h-3 w-3" />
          <span>Last 2 min</span>
        </div>
      </div>

      <ul className="space-y-2 overflow-hidden">
        {events.map((e, i) => {
          const Icon = ICONS[e.icon].component;
          return (
            <li
              key={e.id}
              className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-500 ${
                i === 0 ? "bg-green-50/60 animate-slide-down" : ""
              }`}
              style={{ opacity: 1 - i * 0.12 }}
            >
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${ICONS[e.icon].bg}`}
              >
                <Icon className={`h-3.5 w-3.5 ${ICONS[e.icon].fg}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-800">
                  <span className="font-medium">{e.message}</span>
                  {e.location ? (
                    <span className="text-gray-500"> · {e.location}</span>
                  ) : null}
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-gray-400">
                {formatSecondsAgo(e.at)}
              </span>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 400ms ease-out;
        }
      `}</style>
    </div>
  );
}
