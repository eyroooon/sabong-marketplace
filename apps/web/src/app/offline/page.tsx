import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are currently offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          <span aria-hidden>!</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="text-muted-foreground">
          Please check your internet connection. BloodlinePH needs a network
          connection to load fresh listings and messages.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
