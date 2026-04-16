"use client";

import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

/**
 * A premium iPhone-style frame that wraps any content as a phone screen.
 * Uses pure CSS — no images needed.
 */
export function PhoneMockup({ children, className = "" }: PhoneMockupProps) {
  return (
    <div
      className={`relative mx-auto w-[240px] md:w-[260px] ${className}`}
      style={{ filter: "drop-shadow(0 30px 60px rgba(220, 38, 38, 0.25))" }}
    >
      {/* Phone frame */}
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] border-[8px] border-zinc-900 bg-black">
        {/* Notch / Dynamic island */}
        <div className="absolute left-1/2 top-1.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        {/* Screen content */}
        <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
          {children}
        </div>
      </div>
      {/* Reflection highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.05) 100%)",
        }}
      />
    </div>
  );
}

// ============ App Screen Variants ============

export function ScreenFeed() {
  return (
    <div className="flex h-full flex-col bg-black">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[9px] text-white">
        <span>9:41</span>
        <span className="flex gap-1">●●●●</span>
      </div>
      {/* Feed header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="text-xs font-black text-white">
          <span className="text-[#dc2626]">Bloodline</span>
          <span className="ml-1 rounded bg-gradient-to-br from-[#fbbf24] to-[#dc2626] px-1 text-[9px] font-black text-white">
            PH
          </span>
        </div>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] text-white">
          🔔
        </div>
      </div>
      {/* Video feed full bleed */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-zinc-900 to-amber-950" />
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          🐓
        </div>
        {/* Right side icons */}
        <div className="absolute bottom-20 right-2 flex flex-col gap-3">
          {["❤️", "💬", "↗"].map((i, idx) => (
            <div
              key={idx}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xs backdrop-blur"
            >
              {i}
            </div>
          ))}
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-14 left-3 right-14">
          <div className="text-[10px] font-bold text-white">
            @kelso_breeder_ph
          </div>
          <div className="mt-0.5 text-[9px] text-white/80">
            Champion Kelso stag, 10mos — ₱18,000
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-[#fbbf24]/90 px-1.5 py-0.5 text-[8px] font-bold text-black">
            ✓ Verified
          </div>
        </div>
      </div>
      {/* Bottom nav */}
      <div className="flex items-center justify-around border-t border-white/10 bg-black py-2">
        {["🏠", "🔍", "▶️", "💬", "👤"].map((i, idx) => (
          <span
            key={idx}
            className={`text-sm ${idx === 2 ? "text-[#fbbf24]" : "text-white/40"}`}
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScreenListing() {
  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[9px] text-white">
        <span>9:41</span>
        <span>●●●●</span>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-xs text-white">←</span>
        <span className="text-[10px] font-bold text-white">Listing Details</span>
        <span className="text-xs text-white">♡</span>
      </div>
      {/* Image */}
      <div className="mx-3 aspect-video rounded-lg bg-gradient-to-br from-amber-800 to-red-900 flex items-center justify-center text-3xl">
        🐓
      </div>
      {/* Details */}
      <div className="px-3 py-2">
        <div className="text-[11px] font-black text-white">
          Champion Kelso Stag
        </div>
        <div className="text-[10px] font-bold text-[#fbbf24]">₱18,000</div>
        <div className="mt-2 flex gap-1">
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400">
            ✓ Verified
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] text-white/70">
            Pampanga
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]">
          <div className="rounded bg-white/5 px-1.5 py-1 text-white/60">
            Breed: <span className="text-white">Kelso</span>
          </div>
          <div className="rounded bg-white/5 px-1.5 py-1 text-white/60">
            Age: <span className="text-white">10 mos</span>
          </div>
          <div className="rounded bg-white/5 px-1.5 py-1 text-white/60">
            Weight: <span className="text-white">2.1 kg</span>
          </div>
          <div className="rounded bg-white/5 px-1.5 py-1 text-white/60">
            Color: <span className="text-white">Red</span>
          </div>
        </div>
      </div>
      {/* CTAs */}
      <div className="mt-auto flex gap-1.5 px-3 pb-3">
        <button className="flex-1 rounded-lg border border-white/20 py-1.5 text-[9px] font-bold text-white">
          Message
        </button>
        <button className="flex-[2] rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#dc2626] py-1.5 text-[9px] font-bold text-white">
          Buy Now · ₱18,000
        </button>
      </div>
    </div>
  );
}

export function ScreenChat() {
  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[9px] text-white">
        <span>9:41</span>
        <span>●●●●</span>
      </div>
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2">
        <span className="text-xs text-white">←</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#fbbf24] to-[#dc2626] text-[10px]">
          🐓
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-white">
            JR Farm
            <span className="text-[8px] text-emerald-400">✓</span>
          </div>
          <div className="text-[8px] text-emerald-400">● Online</div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-hidden px-3 py-2">
        <div className="flex">
          <div className="max-w-[70%] rounded-lg rounded-tl-sm bg-white/10 px-2 py-1 text-[9px] text-white">
            Available pa ba ito boss?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-lg rounded-tr-sm bg-gradient-to-br from-[#fbbf24] to-[#dc2626] px-2 py-1 text-[9px] text-white">
            Opo sir! Ready for pickup / shipping.
          </div>
        </div>
        <div className="flex">
          <div className="max-w-[70%] rounded-lg rounded-tl-sm bg-white/10 px-2 py-1 text-[9px] text-white">
            Negotiable ba ang price?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="rounded-lg rounded-tr-sm border border-[#fbbf24]/50 bg-[#fbbf24]/10 px-2 py-1 text-[9px] text-[#fbbf24]">
            💰 Offer sent: ₱16,500
          </div>
        </div>
      </div>
      {/* Input */}
      <div className="border-t border-white/10 p-2">
        <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
          <span className="flex-1 text-[9px] text-white/40">Type a message...</span>
          <span className="text-[10px] text-[#fbbf24]">▶</span>
        </div>
      </div>
    </div>
  );
}

export function ScreenOrder() {
  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[9px] text-white">
        <span>9:41</span>
        <span>●●●●</span>
      </div>
      <div className="px-3 pb-2 pt-1 text-center">
        <div className="text-[10px] font-bold text-white">Order Status</div>
        <div className="text-[8px] text-white/50">#BL-20260416</div>
      </div>
      {/* Escrow badge */}
      <div className="mx-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-2">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
          🔒 Escrow Protected
        </div>
        <div className="mt-0.5 text-[8px] text-emerald-200/80">
          Pera hawak ng platform hangga't confirmed
        </div>
      </div>
      {/* Timeline */}
      <div className="px-3 py-3 space-y-2">
        {[
          { label: "Order Placed", done: true },
          { label: "Payment Received", done: true },
          { label: "Shipped via LBC", done: true },
          { label: "Delivered", done: false, active: true },
          { label: "Release Payment", done: false },
        ].map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : step.active
                  ? "bg-[#fbbf24] text-black"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {step.done ? "✓" : idx + 1}
            </div>
            <span
              className={`text-[9px] ${
                step.done
                  ? "text-white"
                  : step.active
                  ? "font-bold text-[#fbbf24]"
                  : "text-white/40"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div className="mt-auto px-3 pb-3">
        <button className="w-full rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#dc2626] py-1.5 text-[9px] font-bold text-white">
          Confirm Na-receive
        </button>
      </div>
    </div>
  );
}
