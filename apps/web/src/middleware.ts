import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/sell",
  "/orders",
  "/messages",
  "/favorites",
  "/notifications",
  "/settings",
  "/admin",
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sabong-access-token")?.value;

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Check if this is an auth route (login/register)
  const isAuthRoute = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Protected route without token → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth route with token → redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sell/:path*",
    "/orders/:path*",
    "/messages/:path*",
    "/favorites/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
