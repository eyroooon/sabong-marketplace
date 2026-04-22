"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { formatPHP } from "@sabong/shared";
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

interface Dispute {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  itemPrice: string;
  totalAmount: string;
  status: string;
  escrowStatus: string;
  buyerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  listingId: string;
}

type Decision = "release" | "refund";

export default function DisputesPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [decisionModal, setDecisionModal] = useState<{
    dispute: Dispute;
    decision: Decision;
  } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ data: Dispute[] }>(
        "/admin/disputes",
        accessToken,
      );
      setItems(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !decisionModal) return;
    setBusyId(decisionModal.dispute.id);
    try {
      await apiPost(
        `/admin/disputes/${decisionModal.dispute.id}/resolve`,
        {
          decision: decisionModal.decision,
          notes: decisionNotes.trim() || "Admin resolved",
        },
        accessToken,
      );
      setDecisionModal(null);
      setDecisionNotes("");
      await load();
    } catch (err: any) {
      alert(err.message || "Resolution failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Active disputes</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Review escrow disputes and decide to release funds or refund.
          </p>
        </div>
        <div className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
          {items.length} to review
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            No disputes right now.
          </p>
          <p className="text-xs text-gray-500">
            All escrow transactions are flowing smoothly.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-red-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {d.orderNumber}
                  </h3>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                    Disputed
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatPHP(Number(d.totalAmount))}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Opened {new Date(d.updatedAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {d.buyerNotes && (
                  <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                      Buyer's complaint
                    </p>
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-red-900/90">
                      {d.buyerNotes}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex flex-row gap-2 md:flex-col md:w-40">
                <button
                  onClick={() =>
                    setDecisionModal({ dispute: d, decision: "release" })
                  }
                  disabled={busyId === d.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Release
                </button>
                <button
                  onClick={() =>
                    setDecisionModal({ dispute: d, decision: "refund" })
                  }
                  disabled={busyId === d.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Refund
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decision modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              {decisionModal.decision === "release"
                ? "Release funds to seller?"
                : "Refund the buyer?"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Order {decisionModal.dispute.orderNumber} —{" "}
              {formatPHP(Number(decisionModal.dispute.totalAmount))}. Both
              parties will be notified.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Resolution notes
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  decisionModal.decision === "release"
                    ? "e.g. Seller shipped as advertised. Evidence supports seller."
                    : "e.g. Bird was not as described in listing photos."
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busyId === decisionModal.dispute.id}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white ${
                    decisionModal.decision === "release"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  Confirm{" "}
                  {decisionModal.decision === "release" ? "release" : "refund"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionModal(null);
                    setDecisionNotes("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
