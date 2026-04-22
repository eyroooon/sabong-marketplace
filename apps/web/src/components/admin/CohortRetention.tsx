"use client";

const COHORTS = [
  { label: "Oct 25", retention: [100, 82, 74, 68] },
  { label: "Nov 25", retention: [100, 85, 78, 72] },
  { label: "Dec 25", retention: [100, 88, 81, 75] },
  { label: "Jan 26", retention: [100, 86, 79, null] },
  { label: "Feb 26", retention: [100, 90, null, null] },
  { label: "Mar 26", retention: [100, null, null, null] },
];

function cellColor(value: number | null): string {
  if (value === null) return "bg-gray-50 text-gray-300";
  if (value >= 85) return "bg-green-100 text-green-800";
  if (value >= 70) return "bg-emerald-100 text-emerald-800";
  if (value >= 55) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function CohortRetention() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Seller cohort retention
      </p>
      <p className="mt-1 text-xs text-gray-500">
        % of sellers still active N months after signup
      </p>

      <div className="mt-4">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="pb-2 pr-2 text-left font-semibold text-gray-500">
                Cohort
              </th>
              {[1, 2, 3, 4].map((m) => (
                <th
                  key={m}
                  className="pb-2 text-center font-semibold text-gray-500"
                >
                  M{m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COHORTS.map((c) => (
              <tr key={c.label}>
                <td className="py-1 pr-2 text-xs font-medium text-gray-700">
                  {c.label}
                </td>
                {c.retention.map((v, i) => (
                  <td key={i} className="px-0.5 py-1 text-center">
                    <div
                      className={`rounded px-1 py-1 text-[11px] font-semibold tabular-nums ${cellColor(v)}`}
                    >
                      {v !== null ? `${v}%` : "—"}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
