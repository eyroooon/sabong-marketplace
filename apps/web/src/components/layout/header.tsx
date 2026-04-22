"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { useT } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Menu, X, Search, Bell } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";

export function Header() {
  const { user, accessToken, isAuthenticated, logout } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiGet<{ count: number }>("/notifications/unread-count", accessToken);
      setUnreadCount(res.count);
    } catch {
      // Silently fail
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q) {
      router.push(`/listings?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/listings");
    }
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">Bloodline</span>
          <span className="rounded-md bg-gradient-to-br from-[#fbbf24] to-[#dc2626] px-1.5 py-0.5 text-lg font-black text-white">PH</span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl mx-8 md:block">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gamefowl (e.g. Kelso stag, Hatch rooster)..."
            className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          <LanguageToggle />
          {isAuthenticated() ? (
            <>
              <Link
                href="/feed"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("nav.feed")}
              </Link>
              <Link
                href="/sell/new"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("nav.sell")}
              </Link>
              <Link
                href="/messages"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("nav.messages")}
              </Link>
              <Link
                href="/notifications"
                className="relative text-muted-foreground hover:text-foreground"
                aria-label={t("nav.notifications")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {user?.firstName}
              </Link>
              <LanguageSwitcher compact />
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <LanguageSwitcher compact />
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t("nav.login")}
              </Link>
              <a
                href="/#waitlist"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#dc2626] px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-900/30 hover:brightness-110"
              >
                Sumali Na
              </a>
            </>
          )}
        </nav>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setMobileMenuOpen(false);
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setMobileSearchOpen(false);
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t border-border bg-white px-4 py-3 md:hidden">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gamefowl..."
              autoFocus
              className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border bg-white shadow-lg md:hidden">
          <nav className="flex flex-col px-4 py-2">
            <Link
              href="/feed"
              onClick={closeMobileMenu}
              className="border-b border-border px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("nav.feed")}
            </Link>

            {isAuthenticated() ? (
              <>
                <Link
                  href="/sell/new"
                  onClick={closeMobileMenu}
                  className="border-b border-border px-2 py-3 text-sm font-medium text-primary hover:text-primary/80"
                >
                  {t("nav.sell")}
                </Link>
                <Link
                  href="/messages"
                  onClick={closeMobileMenu}
                  className="border-b border-border px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("nav.messages")}
                </Link>
                <Link
                  href="/notifications"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between border-b border-border px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>{t("nav.notifications")}</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="border-b border-border px-2 py-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("nav.dashboard")}
                </Link>
                <div className="border-b border-border px-2 py-3">
                  <LanguageSwitcher compact />
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="border-b border-border px-2 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <div className="border-b border-border px-2 py-3">
                  <LanguageSwitcher compact />
                </div>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="border-b border-border px-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("nav.login")}
                </Link>
                <a
                  href="/#waitlist"
                  onClick={closeMobileMenu}
                  className="mt-1 inline-block rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#dc2626] px-3 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-red-900/30"
                >
                  Sumali sa Early Access
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
