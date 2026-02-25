"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">Sabong</span>
          <span className="text-2xl font-bold text-secondary">Market</span>
        </Link>

        {/* Search */}
        <div className="hidden flex-1 max-w-xl mx-8 md:block">
          <input
            type="text"
            placeholder="Search gamefowl (e.g. Kelso stag, Hatch rooster)..."
            className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          {isAuthenticated() ? (
            <>
              <Link
                href="/sell/new"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sell
              </Link>
              <Link
                href="/messages"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Messages
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {user?.firstName}
              </Link>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
