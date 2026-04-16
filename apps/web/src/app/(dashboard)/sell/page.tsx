"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@sabong/shared";

interface MyPlan {
  plan: "free" | "basic" | "pro";
  planDetails: { name: string };
  usage: {
    activeListings: number;
    maxActiveListings: number;
    videosThisMonth: number;
    maxVideosPerMonth: number;
  };
}

export default function MyListingsPage() {
  const { accessToken } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [myPlan, setMyPlan] = useState<MyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      Promise.all([
        apiGet<any>("/listings/my", accessToken)
          .then((res) => setListings(res.data || []))
          .catch(() => setListings([])),
        apiGet<any>("/sellers/me", accessToken)
          .then(setSellerProfile)
          .catch(() => setSellerProfile(null)),
        apiGet<MyPlan>("/sellers/me/plan", accessToken)
          .then(setMyPlan)
          .catch(() => setMyPlan(null)),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  const maxListings = myPlan?.usage.maxActiveListings ?? null;
  const activeListingsUsed = myPlan?.usage.activeListings ?? 0;
  const hasLimit = maxListings !== null && maxListings !== -1;
  const atLimit = hasLimit && activeListingsUsed >= (maxListings as number);
  const nearLimit =
    hasLimit &&
    !atLimit &&
    activeListingsUsed >= Math.max(1, Math.floor((maxListings as number) * 0.8));
  const planBadgeColor =
    myPlan?.plan === "pro"
      ? "bg-purple-100 text-purple-700"
      : myPlan?.plan === "basic"
        ? "bg-blue-100 text-blue-700"
        : "bg-gray-100 text-gray-700";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">My Listings</h1>
          {myPlan && (
            <Link
              href="/plans"
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${planBadgeColor}`}
            >
              {myPlan.planDetails.name} plan
            </Link>
          )}
        </div>
        <Link
          href="/sell/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          New Listing
        </Link>
      </div>

      {/* Plan Usage Warning */}
      {myPlan && hasLimit && (nearLimit || atLimit) && (
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
            atLimit
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-yellow-200 bg-yellow-50 text-yellow-800"
          }`}
        >
          <div>
            {atLimit ? (
              <>
                <span className="font-medium">
                  You&apos;ve reached your listing limit
                </span>{" "}
                ({activeListingsUsed}/{maxListings}). Upgrade your plan to add
                more listings.
              </>
            ) : (
              <>
                <span className="font-medium">
                  You&apos;ve used {activeListingsUsed}/{maxListings} listings.
                </span>{" "}
                Upgrade to unlock more.
              </>
            )}
          </div>
          <Link
            href="/plans"
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
              atLimit ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {atLimit ? "Upgrade your plan" : "View plans"}
          </Link>
        </div>
      )}

      {/* Verification Status Banner */}
      {sellerProfile && (
        <div className="mt-4">
          {sellerProfile.verificationStatus === "verified" && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Verified Seller</span>
              {sellerProfile.verifiedAt && (
                <span className="text-green-600">
                  &mdash; since{" "}
                  {new Date(sellerProfile.verifiedAt).toLocaleDateString(
                    "en-PH",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </span>
              )}
            </div>
          )}
          {sellerProfile.verificationStatus === "pending" && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <span className="font-medium">Verification pending</span> &mdash;
                your documents are under review. We&apos;ll notify you within 24-48 hours.
              </span>
            </div>
          )}
          {(sellerProfile.verificationStatus === "rejected" ||
            (!sellerProfile.governmentIdUrl &&
              sellerProfile.verificationStatus !== "verified")) && (
            <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {sellerProfile.verificationStatus === "rejected" ? (
                    <>
                      <span className="font-medium">Verification rejected</span>{" "}
                      &mdash; please re-upload your documents.
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Not yet verified</span> &mdash;
                      upload your documents to get a verified seller badge.
                    </>
                  )}
                </span>
              </div>
              <Link
                href="/settings#verification"
                className="ml-3 flex-shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Upload Documents
              </Link>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-border p-4"
            >
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{listing.title}</h3>
                <p className="text-sm text-primary font-semibold">
                  {formatPHP(Number(listing.price))}
                </p>
                <div className="mt-1 flex gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      listing.status === "active"
                        ? "bg-green-100 text-green-700"
                        : listing.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {listing.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {listing.viewCount} views
                  </span>
                </div>
              </div>
              <Link
                href={`/sell/${listing.id}/edit`}
                className="rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-muted"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            You don&apos;t have any listings yet.
          </p>
          <Link
            href="/sell/new"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create Your First Listing
          </Link>
        </div>
      )}
    </div>
  );
}
