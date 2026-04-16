"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  reporterId: string;
  reportType: string;
  listingId: string | null;
  reportedUserId: string | null;
  reviewId: string | null;
  reason: string;
  description: string | null;
  evidenceUrls: string[] | null;
  status: string;
  adminNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface ReportsResponse {
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
] as const;

const REPORT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  listing: {
    label: "Listing",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  user: {
    label: "User",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  review: {
    label: "Review",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  resolved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
  dismissed: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

const ACTION_OPTIONS = [
  { value: "", label: "No additional action", destructive: false },
  {
    value: "deactivate_listing",
    label: "Archive the listing",
    destructive: true,
  },
  {
    value: "deactivate_user",
    label: "Deactivate the user",
    destructive: true,
  },
];

const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Icons ────────────────────────────────────────────────────────────────────

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function reportTypeIcon(type: string) {
  switch (type) {
    case "listing":
      return <FlagIcon className="h-5 w-5" />;
    case "user":
      return <UserIcon className="h-5 w-5" />;
    case "review":
      return <ChatBubbleIcon className="h-5 w-5" />;
    default:
      return <FlagIcon className="h-5 w-5" />;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { accessToken } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Set<string>
  >(new Set());

  // Resolve modal state
  const [resolveModal, setResolveModal] = useState<Report | null>(null);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");
  const [resolving, setResolving] = useState(false);

  // Dismiss state
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReports = useCallback(
    (page = 1) => {
      if (!accessToken) return;
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set("status", statusFilter);

      apiGet<ReportsResponse>(`/admin/reports?${params}`, accessToken)
        .then((res) => {
          setReports(res.data);
          setPagination(res.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [accessToken, statusFilter],
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleResolve = async () => {
    if (!accessToken || !resolveModal || !notes.trim()) return;
    setResolving(true);

    try {
      await apiPatch(
        `/admin/reports/${resolveModal.id}/resolve`,
        { notes, action: action || undefined },
        accessToken,
      );

      setReports((prev) =>
        prev.map((r) =>
          r.id === resolveModal.id
            ? {
                ...r,
                status: "resolved",
                adminNotes: notes,
                resolvedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      closeModal();
    } catch {
      // keep modal open on error
    } finally {
      setResolving(false);
    }
  };

  const handleDismiss = async (report: Report) => {
    if (!accessToken) return;
    setDismissingId(report.id);

    try {
      await apiPatch(
        `/admin/reports/${report.id}/resolve`,
        { notes: "Dismissed by admin", action: undefined },
        accessToken,
      );

      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: "dismissed",
                adminNotes: "Dismissed by admin",
                resolvedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
    } catch {
      // ignore
    } finally {
      setDismissingId(null);
    }
  };

  const closeModal = () => {
    setResolveModal(null);
    setNotes("");
    setAction("");
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Computed ───────────────────────────────────────────────────────────────

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const pageStart = (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {pagination.total.toLocaleString()}
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and resolve reported content and users
        </p>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading reports...
          </p>
        </div>
      ) : reports.length === 0 ? (
        /* ── Empty State ────────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white py-20 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <ShieldCheckIcon className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            All clear!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter === "pending"
              ? "No pending reports to review."
              : statusFilter
                ? `No ${statusFilter} reports found.`
                : "No reports have been submitted yet."}
          </p>
        </div>
      ) : (
        /* ── Report Cards ───────────────────────────────────────────────── */
        <div className="space-y-3">
          {reports.map((report) => {
            const typeConfig = REPORT_TYPE_CONFIG[report.reportType] || {
              label: report.reportType,
              color: "text-gray-700",
              bgColor: "bg-gray-50",
            };
            const statusStyle = STATUS_STYLES[report.status] || {
              bg: "bg-gray-100",
              text: "text-gray-600",
              dot: "bg-gray-400",
            };
            const isDescExpanded = expandedDescriptions.has(report.id);
            const descLong =
              report.description && report.description.length > 120;

            return (
              <div
                key={report.id}
                className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex gap-4 p-5">
                  {/* ── Left: Icon ──────────────────────────────────────── */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig.bgColor} ${typeConfig.color}`}
                  >
                    {reportTypeIcon(report.reportType)}
                  </div>

                  {/* ── Middle: Content ─────────────────────────────────── */}
                  <div className="min-w-0 flex-1">
                    {/* Type badge + reason */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${typeConfig.bgColor} ${typeConfig.color}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {report.reason}
                      </span>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <div className="mt-2">
                        <p className="text-sm leading-relaxed text-gray-600">
                          {isDescExpanded || !descLong
                            ? report.description
                            : `${report.description.slice(0, 120)}...`}
                        </p>
                        {descLong && (
                          <button
                            onClick={() => toggleDescription(report.id)}
                            className="mt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            {isDescExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reporter info */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>
                        Reported by{" "}
                        <span className="font-mono text-gray-500">
                          {report.reporterId.slice(0, 8)}
                        </span>{" "}
                        on {formatDate(report.createdAt)}
                      </span>
                      {report.listingId && (
                        <span>
                          Listing:{" "}
                          <span className="font-mono text-gray-500">
                            {report.listingId.slice(0, 8)}
                          </span>
                        </span>
                      )}
                      {report.reportedUserId && (
                        <span>
                          User:{" "}
                          <span className="font-mono text-gray-500">
                            {report.reportedUserId.slice(0, 8)}
                          </span>
                        </span>
                      )}
                      {report.reviewId && (
                        <span>
                          Review:{" "}
                          <span className="font-mono text-gray-500">
                            {report.reviewId.slice(0, 8)}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Resolution info for resolved/dismissed */}
                    {report.status !== "pending" && report.adminNotes && (
                      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <ShieldCheckIcon className="h-3.5 w-3.5" />
                          {report.status === "resolved"
                            ? "Resolved"
                            : "Dismissed"}
                          {report.resolvedBy && (
                            <>
                              {" "}
                              by{" "}
                              <span className="font-mono">
                                {report.resolvedBy.slice(0, 8)}
                              </span>
                            </>
                          )}
                          {report.resolvedAt && (
                            <>
                              {" "}
                              on {formatDate(report.resolvedAt)}
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {report.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Right: Status + Actions ────────────────────────── */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                      />
                      {report.status.charAt(0).toUpperCase() +
                        report.status.slice(1)}
                    </span>

                    {/* Action buttons for pending */}
                    {report.status === "pending" && (
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => setResolveModal(report)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismiss(report)}
                          disabled={dismissingId === report.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          {dismissingId === report.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-gray-600" />
                          ) : (
                            <XMarkIcon className="h-3.5 w-3.5" />
                          )}
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="mt-auto text-xs text-gray-400">
                      {relativeDate(report.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!loading && reports.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{pageStart}</span>
            {" - "}
            <span className="font-medium text-gray-700">{pageEnd}</span>
            {" of "}
            <span className="font-medium text-gray-700">
              {pagination.total.toLocaleString()}
            </span>{" "}
            reports
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchReports(pagination.page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchReports(pagination.page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Resolve Modal ──────────────────────────────────────────────────── */}
      {resolveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Resolve Report
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Report Summary */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                      (
                        REPORT_TYPE_CONFIG[resolveModal.reportType] || {
                          bgColor: "bg-gray-50",
                          color: "text-gray-700",
                        }
                      ).bgColor
                    } ${
                      (
                        REPORT_TYPE_CONFIG[resolveModal.reportType] || {
                          bgColor: "bg-gray-50",
                          color: "text-gray-700",
                        }
                      ).color
                    }`}
                  >
                    {(
                      REPORT_TYPE_CONFIG[resolveModal.reportType] || {
                        label: resolveModal.reportType,
                      }
                    ).label}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {resolveModal.reason}
                  </span>
                </div>
                {resolveModal.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {resolveModal.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Reported on {formatDate(resolveModal.createdAt)}
                </p>
              </div>

              {/* Admin Notes */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Admin Notes{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-gray-400">
                  Describe the resolution and any actions taken
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Add resolution notes..."
                />
              </div>

              {/* Action Selector */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Additional Action
                </label>
                <p className="mt-0.5 text-xs text-gray-400">
                  Optionally take action on the reported content
                </p>
                <div className="mt-2 space-y-2">
                  {ACTION_OPTIONS.map((opt) => {
                    // Filter out irrelevant options
                    if (
                      opt.value === "deactivate_listing" &&
                      !resolveModal.listingId
                    )
                      return null;
                    if (
                      opt.value === "deactivate_user" &&
                      !resolveModal.reportedUserId
                    )
                      return null;

                    const isSelected = action === opt.value;

                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                          isSelected
                            ? opt.destructive
                              ? "border-red-200 bg-red-50"
                              : "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="resolve_action"
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => setAction(opt.value)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span
                          className={`text-sm font-medium ${
                            isSelected && opt.destructive
                              ? "text-red-700"
                              : "text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.destructive && (
                          <span className="ml-auto rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                            Destructive
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warning for destructive actions */}
              {action && ACTION_OPTIONS.find((o) => o.value === action)?.destructive && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      This action cannot be easily undone
                    </p>
                    <p className="mt-0.5 text-xs text-amber-600">
                      {action === "deactivate_listing"
                        ? "The listing will be archived and hidden from the marketplace."
                        : "The user account will be deactivated and they will not be able to log in."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!notes.trim() || resolving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolving && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
