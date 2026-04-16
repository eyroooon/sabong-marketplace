"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Item {
  q: string;
  a: string;
}

export function Faq({ items }: { items: Item[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
      {items.map((item, idx) => {
        const open = openIdx === idx;
        return (
          <button
            key={idx}
            onClick={() => setOpenIdx(open ? null : idx)}
            className="flex w-full flex-col items-start gap-2 px-5 py-4 text-left transition hover:bg-white/[0.02] md:px-6 md:py-5"
          >
            <div className="flex w-full items-center justify-between gap-4">
              <span className="text-base font-semibold text-white md:text-lg">
                {item.q}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-white/60 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
            <div
              className={`grid transition-all duration-300 ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <p className="overflow-hidden text-sm leading-relaxed text-white/70 md:text-base">
                {item.a}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
