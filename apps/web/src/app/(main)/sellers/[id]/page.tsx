"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { VerifiedBadge } from "@/components/verified-badge";
import { TrustScore } from "@/components/sellers/trust-score";

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "text-xl" : "text-base";
  return (
    <span className={`inline-flex gap-0.5 ${starSize}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(value) ? "text-yellow-400" : "text-gray-300"}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

function SalesSparkline({
  data,
  labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
}: {
  data: number[];
  labels?: string[];
}) {
  const width = 160;
  const height = 40;
  const padX = 4;
  const padY = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);

  const points = data.map((v, i) => {
    const x = padX + (i * (width - padX * 2)) / Math.max(data.length - 1, 1);
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastIdx = data.length - 1;
  const lastPoint = points[lastIdx]?.split(",").map(Number) ?? [0, 0];

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Sales trend</p>
        <p className="text-[10px] text-muted-foreground">
          {labels[0]}&mdash;{labels[labels.length - 1]}
        </p>
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Sales trend sparkline"
        className="overflow-visible"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          points={points.join(" ")}
        />
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r={2.5}
          className="fill-primary"
        />
      </svg>
      <span className="text-sm font-semibold text-primary">
        +{data[lastIdx] - data[0]}
      </span>
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  if (!value || value === 0) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium">{value.toFixed(1)}</span>
    </div>
  );
}

export default function SellerProfilePage() {
  const params = useParams();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);

  useEffect(() => {
    if (params.id) {
      apiGet(`/sellers/${params.id}`)
        .then(setSeller)
        .catch(() => setSeller(null))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchReviews(1);
    }
  }, [params.id]);

  async function fetchReviews(page: number) {
    setReviewsLoading(true);
    try {
      const res = await apiGet(`/reviews/seller/${params.id}?page=${page}&limit=10`);
      setReviewsData(res);
      setReviewsPage(page);
    } catch {
      setReviewsData(null);
    } finally {
      setReviewsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Seller Not Found</h1>
        <Link href="/listings" className="mt-4 inline-block text-primary hover:underline">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {seller.farmName?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{seller.farmName}</h1>
              {seller.verificationStatus === "verified" && <VerifiedBadge size="md" />}
              {seller.verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
              {seller.verificationStatus === "pending" && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  Pending Verification
                </span>
              )}
            </div>

            {(seller.farmProvince || seller.farmCity) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {[seller.farmCity, seller.farmProvince].filter(Boolean).join(", ")}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                Member since{" "}
                {new Date(seller.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              {seller.verificationStatus === "verified" && seller.verifiedAt && (
                <span className="text-green-600">
                  Verified since{" "}
                  {new Date(seller.verifiedAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {seller.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {seller.description}
          </p>
        )}
      </div>

      {/* Trust Score */}
      <div className="mt-6">
        <TrustScore
          verificationStatus={seller.verificationStatus}
          totalSales={seller.totalSales}
          avgRating={seller.avgRating}
          responseRate={seller.responseRate}
          responseTime={seller.responseTime}
        />
      </div>

      {/* Sales trend sparkline */}
      <div className="mt-4 rounded-xl border border-border p-4">
        <SalesSparkline data={[3, 5, 4, 8, 12, 15]} />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{seller.totalSales || 0}</p>
          <p className="text-xs text-muted-foreground">Total Sales</p>
        </div>
        <div className="rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{seller.totalListings || 0}</p>
          <p className="text-xs text-muted-foreground">Listings</p>
        </div>
        <div className="rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">
            {seller.avgRating > 0 ? Number(seller.avgRating).toFixed(1) : "\u2014"}
          </p>
          <p className="text-xs text-muted-foreground">
            Rating ({seller.ratingCount || 0} reviews)
          </p>
        </div>
        <div className="rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">
            {seller.responseRate ? `${seller.responseRate}%` : "\u2014"}
          </p>
          <p className="text-xs text-muted-foreground">Response Rate</p>
        </div>
      </div>

      {/* Social Links */}
      {(seller.facebookUrl || seller.youtubeUrl || seller.tiktokUrl) && (
        <div className="mt-6 rounded-xl border border-border p-4">
          <h2 className="mb-3 font-semibold">Social Links</h2>
          <div className="flex flex-wrap gap-3">
            {seller.facebookUrl && (
              <a
                href={seller.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted"
              >
                Facebook
              </a>
            )}
            {seller.youtubeUrl && (
              <a
                href={seller.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted"
              >
                YouTube
              </a>
            )}
            {seller.tiktokUrl && (
              <a
                href={seller.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted"
              >
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* Plan Badge */}
      <div className="mt-6 rounded-xl border border-border p-4">
        <h2 className="mb-2 font-semibold">Seller Plan</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            seller.plan === "pro"
              ? "bg-purple-100 text-purple-700"
              : seller.plan === "breeder"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {seller.plan === "pro"
            ? "Pro Seller"
            : seller.plan === "breeder"
              ? "Breeder Plan"
              : "Free Plan"}
        </span>
      </div>

      {/* Reviews Section */}
      <div className="mt-6 rounded-xl border border-border p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Reviews
          {reviewsData?.pagination?.total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({reviewsData.pagination.total})
            </span>
          )}
        </h2>

        {/* Average Breakdown */}
        {reviewsData?.averages && reviewsData.averages.overall > 0 && (
          <div className="mb-6 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-bold">
                {reviewsData.averages.overall.toFixed(1)}
              </span>
              <div>
                <StarDisplay value={reviewsData.averages.overall} size="lg" />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {reviewsData.pagination.total} review{reviewsData.pagination.total !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <RatingBar label="Accuracy" value={reviewsData.averages.accuracy} />
              <RatingBar label="Communication" value={reviewsData.averages.communication} />
              <RatingBar label="Shipping" value={reviewsData.averages.shipping} />
            </div>
          </div>
        )}

        {/* Review List */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-lg border border-border p-4">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : reviewsData?.data?.length > 0 ? (
          <div className="space-y-4">
            {reviewsData.data.map((review: any) => (
              <div key={review.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <StarDisplay value={review.rating} />
                    {review.title && (
                      <p className="mt-1 font-medium">{review.title}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {review.comment}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  By {review.reviewerFirstName} {review.reviewerLastName?.charAt(0)}.
                  {review.listingTitle && (
                    <span> &middot; {review.listingTitle}</span>
                  )}
                </p>

                {/* Sub-ratings */}
                {(review.accuracyRating || review.communicationRating || review.shippingRating) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {review.accuracyRating > 0 && (
                      <span>Accuracy: <StarDisplay value={review.accuracyRating} /></span>
                    )}
                    {review.communicationRating > 0 && (
                      <span>Communication: <StarDisplay value={review.communicationRating} /></span>
                    )}
                    {review.shippingRating > 0 && (
                      <span>Shipping: <StarDisplay value={review.shippingRating} /></span>
                    )}
                  </div>
                )}

                {/* Seller Response */}
                {review.sellerResponse && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Seller Response
                      {review.sellerRespondedAt && (
                        <span className="ml-1 font-normal">
                          &middot;{" "}
                          {new Date(review.sellerRespondedAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{review.sellerResponse}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {reviewsData.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => fetchReviews(reviewsPage - 1)}
                  disabled={reviewsPage <= 1}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Page {reviewsPage} of {reviewsData.pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchReviews(reviewsPage + 1)}
                  disabled={reviewsPage >= reviewsData.pagination.totalPages}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
