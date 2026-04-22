import Link from "next/link";
import { formatPHP } from "@sabong/shared";
import { VerifiedBadge } from "@/components/verified-badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
// Strip /api suffix if present so we get the base host for static assets
const API_HOST = API_URL.replace(/\/api\/?$/, "");

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    slug: string;
    category: string;
    breed?: string | null;
    ageMonths?: number | null;
    weightKg?: string | null;
    price: string;
    priceType: string;
    locationProvince: string;
    locationCity: string;
    primaryImage?: string | null;
    images?: { url: string; isPrimary?: boolean }[] | null;
    viewCount: number;
    favoriteCount: number;
    sellerVerified?: boolean;
    sellerName?: string | null;
  };
}

function getImageUrl(listing: ListingCardProps["listing"]): string | null {
  if (listing.primaryImage) {
    // If it's already a full URL, use as-is; otherwise prefix with API host
    if (listing.primaryImage.startsWith("http")) return listing.primaryImage;
    return `${API_HOST}${listing.primaryImage}`;
  }
  if (listing.images && listing.images.length > 0) {
    const primary = listing.images.find((img) => img.isPrimary) || listing.images[0];
    if (primary.url.startsWith("http")) return primary.url;
    return `${API_HOST}${primary.url}`;
  }
  return null;
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = getImageUrl(listing);

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {listing.sellerVerified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-lg font-bold text-primary">
          {formatPHP(Number(listing.price))}
          {listing.priceType === "negotiable" && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (Negotiable)
            </span>
          )}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-tight">
          {listing.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
            {listing.category}
          </span>
          {listing.breed && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {listing.breed}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {listing.locationCity}, {listing.locationProvince}
        </p>
        {listing.sellerName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{listing.sellerName}</span>
            {listing.sellerVerified && <VerifiedBadge size="sm" />}
          </p>
        )}
      </div>
    </Link>
  );
}
