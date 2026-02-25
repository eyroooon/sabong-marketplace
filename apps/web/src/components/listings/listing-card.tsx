import Link from "next/link";
import { formatPHP } from "@sabong/shared";

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
    viewCount: number;
    favoriteCount: number;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="aspect-square bg-muted">
        {listing.primaryImage ? (
          <img
            src={listing.primaryImage}
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
      </div>
    </Link>
  );
}
