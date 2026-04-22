"use client";

import { useEffect, useState } from "react";

/**
 * Fullscreen celebration overlay that animates a peso amount
 * counting up from 0 to `amount` over ~1.4s, with a checkmark
 * and 'Payment released' message. Auto-dismisses after 3s.
 */
export function ReleaseCelebration({
  amount,
  onClose,
}: {
  amount: number;
  onClose: () => void;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const durationMs = 1400;
    const start = Date.now();
    let rafId = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(amount * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(amount);
      }
    };

    rafId = requestAnimationFrame(tick);

    const dismiss = setTimeout(onClose, 3000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(dismiss);
    };
  }, [amount, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm celebration-fade-in"
      onClick={onClose}
      role="button"
      aria-label="Dismiss"
    >
      <div className="relative flex flex-col items-center gap-6 px-8 py-10">
        {/* Sparkle rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute h-60 w-60 rounded-full border-2 border-green-400/40 ring-pulse-1" />
          <div className="absolute h-60 w-60 rounded-full border-2 border-green-400/30 ring-pulse-2" />
          <div className="absolute h-60 w-60 rounded-full border-2 border-emerald-400/20 ring-pulse-3" />
        </div>

        {/* Check icon */}
        <div className="check-pop relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-2xl shadow-green-600/40">
          <svg
            className="h-14 w-14 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        {/* Text */}
        <div className="relative z-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-300">
            Payment Released
          </p>
          <p className="mt-3 text-5xl font-black tabular-nums text-white sm:text-6xl">
            ₱{displayValue.toLocaleString("en-PH")}
          </p>
          <p className="mt-3 text-sm text-white/75">
            Transferred to seller · Transaction complete
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes celebration-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .celebration-fade-in {
          animation: celebration-fade-in 250ms ease-out;
        }

        @keyframes check-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          60% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .check-pop {
          animation: check-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes ring-pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .ring-pulse-1 {
          animation: ring-pulse 1.5s ease-out infinite;
        }
        .ring-pulse-2 {
          animation: ring-pulse 1.5s ease-out infinite 0.4s;
        }
        .ring-pulse-3 {
          animation: ring-pulse 1.5s ease-out infinite 0.8s;
        }
      `}</style>
    </div>
  );
}
