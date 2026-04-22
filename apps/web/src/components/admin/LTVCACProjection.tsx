"use client";

export function LTVCACProjection() {
  const ltv = 8_450;
  const cac = 1_200;
  const ratio = ltv / cac;
  const paybackMonths = 3.2;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Unit Economics
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          Healthy
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-gray-500">LTV</p>
          <p className="text-2xl font-black tabular-nums text-amber-600">
            ₱{ltv.toLocaleString("en-PH")}
          </p>
          <p className="text-[10px] text-gray-400">Lifetime value per seller</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">CAC</p>
          <p className="text-2xl font-black tabular-nums text-gray-700">
            ₱{cac.toLocaleString("en-PH")}
          </p>
          <p className="text-[10px] text-gray-400">Customer acquisition cost</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Payback</p>
          <p className="text-2xl font-black tabular-nums text-blue-600">
            {paybackMonths} mo
          </p>
          <p className="text-[10px] text-gray-400">Months to recoup CAC</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">LTV/CAC</p>
          <p className="text-2xl font-black tabular-nums text-green-600">
            {ratio.toFixed(1)}x
          </p>
          <p className="text-[10px] text-gray-400">Target: 3× or higher</p>
        </div>
      </div>
    </div>
  );
}
