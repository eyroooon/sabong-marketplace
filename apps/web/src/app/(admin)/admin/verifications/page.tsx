"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { BadgeCheck, FileText, MapPin, Phone, ShieldCheck, ShieldX } from "lucide-react";

interface PendingVerification {
  id: string;
  userId: string;
  farmName: string;
  businessType: string | null;
  description: string | null;
  governmentIdUrl: string | null;
  farmPermitUrl: string | null;
  farmProvince: string | null;
  farmCity: string | null;
  createdAt: string;
  userFirstName: string;
  userLastName: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  userPhone: string;
}

export default function VerificationsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<PendingVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiGet<{ data: PendingVerification[] }>(
        "/admin/verifications",
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

  async function approve(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await apiPost(`/admin/verifications/${id}/approve`, {}, accessToken);
      await load();
    } catch (err: any) {
      alert(err.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !rejectModal) return;
    setBusyId(rejectModal.id);
    try {
      await apiPost(
        `/admin/verifications/${rejectModal.id}/reject`,
        { reason: rejectReason.trim() || "No reason given" },
        accessToken,
      );
      setRejectModal(null);
      setRejectReason("");
      await load();
    } catch (err: any) {
      alert(err.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Pending seller verifications
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Approve or reject seller verification submissions.
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {items.length} pending
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-green-500" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            All caught up!
          </p>
          <p className="text-xs text-gray-500">
            No verification requests waiting.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
              {/* Avatar */}
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-lg font-bold text-white">
                {(v.userFirstName[0] || "") + (v.userLastName[0] || "")}
              </div>

              {/* Main info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {v.farmName}
                  </h3>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {v.userFirstName} {v.userLastName}
                  {v.userDisplayName && v.userDisplayName !== `${v.userFirstName} ${v.userLastName}`
                    ? ` (${v.userDisplayName})`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {v.userPhone}
                  </span>
                  {(v.farmCity || v.farmProvince) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[v.farmCity, v.farmProvince].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {v.businessType && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {v.businessType}
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="text-sm text-gray-700">{v.description}</p>
                )}

                {/* Documents */}
                <div className="mt-2 grid grid-cols-2 gap-3 sm:max-w-md">
                  {[
                    { label: "Government ID", url: v.governmentIdUrl },
                    { label: "Farm Permit", url: v.farmPermitUrl },
                  ].map((doc) => (
                    <div
                      key={doc.label}
                      className="relative overflow-hidden rounded-lg border border-gray-200"
                    >
                      {doc.url ? (
                        <button
                          onClick={() => setZoomImage(doc.url)}
                          className="block w-full text-left"
                        >
                          <div className="relative aspect-[4/3] w-full bg-gray-100">
                            <Image
                              src={doc.url}
                              alt={doc.label}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, 200px"
                              unoptimized
                            />
                          </div>
                          <p className="bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700">
                            {doc.label} (click to zoom)
                          </p>
                        </button>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 text-xs text-gray-400">
                          {doc.label} — not provided
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row gap-2 md:flex-col md:w-40">
                <button
                  onClick={() => approve(v.id)}
                  disabled={busyId === v.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => setRejectModal(v)}
                  disabled={busyId === v.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <ShieldX className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative h-full w-full max-w-3xl">
            <Image
              src={zoomImage}
              alt="Verification document"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Reject verification
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Rejecting {rejectModal.farmName}. The seller will be notified
              with your reason.
            </p>
            <form onSubmit={submitReject} className="mt-4 space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="e.g. ID blurred, farm permit expired…"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busyId === rejectModal.id}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason("");
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
