"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPHP } from "@sabong/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_HOST = API_URL.replace(/\/api\/?$/, "");

function imageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_HOST}${url}`;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    if (params.slug) {
      apiGet<any>(`/listings/${params.slug}`)
        .then((data) => {
          setListing(data);
          // Check favorite status if authenticated
          if (isAuthenticated() && data?.id) {
            apiGet<any>(`/favorites/${data.id}/check`, accessToken!)
              .then((res: any) => setIsFavorited(res.isFavorited))
              .catch(() => {});
          }
        })
        .catch(() => setListing(null))
        .finally(() => setLoading(false));
    }
  }, [params.slug]);

  async function handleFavoriteToggle() {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/listings/${params.slug}`);
      return;
    }
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await apiDelete(`/favorites/${listing.id}`, accessToken!);
        setIsFavorited(false);
      } else {
        await apiPost(`/favorites/${listing.id}`, {}, accessToken!);
        setIsFavorited(true);
      }
    } catch (err: any) {
      console.error("Favorite toggle failed:", err.message);
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function handleMessageSeller() {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/listings/${params.slug}`);
      return;
    }
    if (!listing?.seller) return;
    setMessageLoading(true);
    try {
      await apiPost(
        "/messages/conversations",
        {
          sellerId: listing.seller.userId || listing.seller.id,
          listingId: listing.id,
          message: `Hi, I'm interested in your listing: ${listing.title}`,
        },
        accessToken!,
      );
      router.push("/messages");
    } catch (err: any) {
      // If conversation already exists, just navigate to messages
      router.push("/messages");
    } finally {
      setMessageLoading(false);
    }
  }

  function handleBuyNow() {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/listings/${params.slug}`);
      return;
    }
    router.push(`/orders/new?listing=${listing.id}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="aspect-video rounded-xl bg-muted" />
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Listing Not Found</h1>
        <Link href="/listings" className="mt-4 inline-block text-primary hover:underline">
          Browse all listings
        </Link>
      </div>
    );
  }

  const images = listing.images || [];
  const isOwnListing = user?.id === listing.seller?.userId || user?.id === listing.sellerId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Images */}
        <div className="lg:col-span-2">
          {/* Main image */}
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {images[selectedImage]?.url ? (
              <img
                src={imageUrl(images[selectedImage].url)}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === selectedImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={imageUrl(img.thumbnailUrl || img.url)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listing.breed && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Breed</p>
                  <p className="font-medium">{listing.breed}</p>
                </div>
              )}
              {listing.bloodline && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Bloodline</p>
                  <p className="font-medium">{listing.bloodline}</p>
                </div>
              )}
              {listing.ageMonths != null && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="font-medium">{listing.ageMonths} months</p>
                </div>
              )}
              {listing.weightKg && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{listing.weightKg} kg</p>
                </div>
              )}
              {listing.color && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Color</p>
                  <p className="font-medium">{listing.color}</p>
                </div>
              )}
              {listing.fightingStyle && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Fighting Style</p>
                  <p className="font-medium">{listing.fightingStyle}</p>
                </div>
              )}
              {listing.legColor && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Leg Color</p>
                  <p className="font-medium">{listing.legColor}</p>
                </div>
              )}
              {listing.vaccinationStatus && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Vaccination</p>
                  <p className="font-medium capitalize">
                    {listing.vaccinationStatus.replace("_", " ")}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-bold">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {listing.description}
              </p>
            </div>

            {/* Lineage */}
            {(listing.sireInfo || listing.damInfo) && (
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-bold">Lineage</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.sireInfo && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Sire (Father)
                      </p>
                      <p className="font-medium">{listing.sireInfo}</p>
                    </div>
                  )}
                  {listing.damInfo && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Dam (Mother)
                      </p>
                      <p className="font-medium">{listing.damInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Price & Actions */}
        <div>
          <div className="sticky top-20 lg:top-20 space-y-4">
            <div className="rounded-xl border border-border p-6">
              <p className="text-3xl font-bold text-primary">
                {formatPHP(Number(listing.price))}
              </p>
              {listing.priceType === "negotiable" && (
                <p className="text-sm text-muted-foreground">
                  Price is negotiable
                </p>
              )}

              <div className="mt-2">
                <span className="rounded bg-muted px-2 py-1 text-xs font-medium capitalize">
                  {listing.category}
                </span>
              </div>

              <h1 className="mt-4 text-xl font-bold">{listing.title}</h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {listing.locationCity}, {listing.locationProvince}
              </p>

              <div className="mt-6 space-y-3">
                {!isOwnListing && (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleMessageSeller}
                      disabled={messageLoading}
                      className="w-full rounded-lg border border-primary py-3 font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
                    >
                      {messageLoading ? "Opening chat..." : "Message Seller"}
                    </button>
                  </>
                )}
                {isOwnListing && (
                  <Link
                    href={`/sell/${listing.id}/edit`}
                    className="block w-full rounded-lg bg-primary py-3 text-center font-medium text-white hover:bg-primary/90"
                  >
                    Edit Listing
                  </Link>
                )}
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`w-full rounded-lg border py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                    isFavorited
                      ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-input text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {favoriteLoading
                    ? "..."
                    : isFavorited
                      ? "♥ Saved to Favorites"
                      : "♡ Add to Favorites"}
                </button>
              </div>

              {/* Shipping */}
              <div className="mt-6 border-t border-border pt-4 text-sm">
                <p className="font-medium">Shipping</p>
                {listing.shippingAvailable && (
                  <p className="mt-1 text-muted-foreground">
                    Shipping:{" "}
                    {listing.shippingFee
                      ? formatPHP(Number(listing.shippingFee))
                      : "Free"}{" "}
                    ({listing.shippingAreas})
                  </p>
                )}
              </div>
            </div>

            {/* Seller Card */}
            {listing.seller && (
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {listing.seller.farmName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{listing.seller.farmName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {listing.seller.verificationStatus === "verified" && (
                        <span className="text-green-600">Verified</span>
                      )}
                      {listing.seller.avgRating > 0 && (
                        <span>
                          {Number(listing.seller.avgRating).toFixed(1)} rating
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/sellers/${listing.seller.id}`}
                  className="mt-3 block rounded-lg border border-input py-2 text-center text-sm hover:bg-muted"
                >
                  View Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
