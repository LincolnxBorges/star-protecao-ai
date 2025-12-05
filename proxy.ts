import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/login",
  "/signup",
  "/cotacao", // Public quotation form
];

// Auth routes that authenticated users shouldn't access
const authRoutes = ["/login", "/signup"];

// Admin routes that require SELLER or ADMIN role
const adminRoutes = ["/cotacoes", "/precos", "/blacklist"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionToken = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionToken;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for admin routes
  if (!isAuthenticated && isAdminRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect unauthenticated users to login for protected routes (home page)
  if (!isAuthenticated && pathname === "/") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes with authenticated users, the actual role check
  // happens in the page/API route server-side via sellers table
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
