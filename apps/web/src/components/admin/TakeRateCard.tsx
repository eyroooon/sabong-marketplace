"use client";

const REVENUE_STREAMS = [
  { label: "Platform fees (5%)", amount: 18_450, color: "bg-green-500" },
  { label: "Delivery markup", amount: 3_820, color: "bg-blue-500" },
  { label: "Seller subscriptions", amount: 2_100, color: "bg-purple-500" },
  { label: "Featured listings", amount: 980, color: "bg-amber-500" },
];

export function TakeRateCard() {
  const total = REVENUE_STREAMS.reduce((sum, r) => sum + r.amount, 0);
  const max = Math.max(...REVENUE_STREAMS.map((r) => r.amount));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Revenue breakdown
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-gray-900">
        ₱{total.toLocaleString("en-PH")}
      </p>
      <p className="text-xs text-gray-500">This month</p>

      <div className="mt-4 space-y-3">
        {REVENUE_STREAMS.map((r) => {
          const pct = (r.amount / max) * 100;
          return (
            <div key={r.label}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-gray-700">{r.label}</span>
                <span className="font-semibold tabular-nums text-gray-900">
                  ₱{r.amount.toLocaleString("en-PH")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`${r.color} h-full rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
