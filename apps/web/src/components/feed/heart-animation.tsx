"use client";

import { useEffect, useState } from "react";

interface HeartAnimationProps {
  show: boolean;
  onComplete: () => void;
}

export function HeartAnimation({ show, onComplete }: HeartAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-24 w-24 text-red-500 animate-[heartPop_0.8s_ease-out_forwards]"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(239, 68, 68, 0.5))",
        }}
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
      <style jsx>{`
        @keyframes heartPop {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          70% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
