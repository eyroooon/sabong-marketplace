"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  target: number;
  label: string;
  sublabel?: string;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
}

export function StatCounter({
  target,
  label,
  sublabel,
  suffix = "",
  prefix = "",
  icon,
}: StatCounterProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            animate();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  function animate() {
    const duration = 1800;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.floor(target * eased));
      if (t < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }

  return (
    <div
      ref={ref}
      className="glass rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
    >
      {icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#dc2626] to-[#fbbf24] text-white">
          {icon}
        </div>
      )}
      <div className="text-3xl font-black tracking-tight text-white md:text-4xl">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm font-semibold text-white/80">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-white/50">{sublabel}</div>}
    </div>
  );
}
