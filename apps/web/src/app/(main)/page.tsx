import Link from "next/link";
import { CATEGORIES } from "@sabong/shared";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary to-gray-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            Buy & Sell <span className="text-primary">Gamefowl</span> Online
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            The #1 trusted marketplace for gamefowl in the Philippines. Browse
            thousands of listings from verified breeders nationwide.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex overflow-hidden rounded-xl bg-white">
              <input
                type="text"
                placeholder="Search breed, location, or keyword..."
                className="flex-1 px-4 py-3 text-foreground focus:outline-none"
              />
              <button className="bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-6 text-2xl font-bold">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/listings?category=${cat.slug}`}
                className="flex flex-col items-center rounded-xl border border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                  {cat.slug === "rooster" && "🐓"}
                  {cat.slug === "hen" && "🐔"}
                  {cat.slug === "stag" && "🐓"}
                  {cat.slug === "pullet" && "🐔"}
                  {cat.slug === "pair" && "🐓"}
                  {cat.slug === "brood" && "🐔"}
                </div>
                <h3 className="mt-3 font-semibold">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.nameFil}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">
            How SabongMarket Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">Browse & Search</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Find gamefowl by breed, bloodline, location, and more. Filter
                thousands of listings to find exactly what you need.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">Chat & Negotiate</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Message sellers directly, ask questions, and negotiate prices.
                Make offers within the chat.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold">Pay Securely</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pay with GCash, Maya, credit card, or bank transfer. Your
                payment is held in escrow until delivery is confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-2xl font-bold">Ready to Sell Your Gamefowl?</h2>
          <p className="mt-2 text-muted-foreground">
            Join thousands of breeders and sellers on SabongMarket.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white hover:bg-primary/90"
          >
            Start Selling Now
          </Link>
        </div>
      </section>
    </div>
  );
}
