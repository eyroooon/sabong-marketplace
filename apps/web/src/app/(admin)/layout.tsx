"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  Store,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  LogOut,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function getPageTitle(pathname: string): string {
  const match = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href)),
  );
  return match?.label ?? "Admin";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const initials =
    (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e293b] transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#dc2626] text-sm font-bold text-white">
              B
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">
                BloodlinePH
              </span>
              <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-[3px] border-blue-500 bg-blue-600/10 pl-[9px] text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0",
                    isActive
                      ? "text-blue-400"
                      : "text-gray-500 group-hover:text-gray-300",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar bottom */}
        <div className="border-t border-gray-700 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {pageTitle}
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                {pageTitle === "Dashboard"
                  ? "Platform overview and analytics"
                  : `Manage ${pageTitle.toLowerCase()}`}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>

            {/* Divider */}
            <div className="mx-1 hidden h-8 w-px bg-gray-200 sm:block" />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {initials || "A"}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user.firstName}
                  </p>
                  <p className="text-[11px] text-gray-500">Admin</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Marketplace
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
