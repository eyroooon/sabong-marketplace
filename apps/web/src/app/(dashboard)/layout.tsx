"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sell", label: "My Listings" },
  { href: "/sell/new", label: "Create Listing" },
  { href: "/orders", label: "My Orders" },
  { href: "/messages", label: "Messages" },
  { href: "/favorites", label: "Favorites" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
