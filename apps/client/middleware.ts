/**
 * Next.js Middleware for Route Protection
 *
 * This middleware runs on every request and handles:
 * - Authentication checks for protected routes
 * - Automatic redirects for unauthenticated users
 * - Token validation and refresh
 * - Session security
 */

import { NextRequest, NextResponse } from "next/server";

// Define which routes require authentication
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/settings",
  "/profile",
  "/api/protected",
];

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/",
  "/api/auth",
  "/api/metadata",
];

// Check if a path is protected
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Validate JWT token structure (basic check)
function isValidTokenFormat(token: string): boolean {
  if (!token) return false;

  // Basic JWT format check (3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    // Try to decode the payload to check if it's valid JSON
    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("🕒 Token expired:", new Date(payload.exp * 1000));
      return false;
    }

    return true;
  } catch (error) {
    console.log("❌ Invalid token format:", error);
    return false;
  }
}

// Get authentication tokens from request
function getAuthTokens(request: NextRequest) {
  // Check multiple sources for the token
  const cookieToken = request.cookies.get("auth_token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  return {
    cookieToken,
    bearerToken,
    hasAnyToken: !!(cookieToken || bearerToken),
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`🛡️ Middleware: ${request.method} ${pathname}`);

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/_") ||
    pathname.startsWith("/static/") ||
    (pathname.includes(".") && !pathname.includes("/api/"))
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  if (!isProtectedRoute(pathname)) {
    // For public routes, continue normally
    return NextResponse.next();
  }

  // This is a protected route - check authentication
  const { cookieToken, bearerToken, hasAnyToken } = getAuthTokens(request);
  const token = cookieToken || bearerToken;

  console.log(`🔐 Protected route access attempt: ${pathname}`);
  console.log(`🍪 Has cookie token: ${!!cookieToken}`);
  console.log(`🔑 Has bearer token: ${!!bearerToken}`);

  // If no token found, redirect to login
  if (!hasAnyToken) {
    console.log("❌ No authentication token found, redirecting to login");
    const loginUrl = new URL("/login", request.url);

    // Add the original URL as a query parameter for post-login redirect
    loginUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // If token exists, validate its format
  if (!isValidTokenFormat(token!)) {
    console.log("❌ Invalid or expired token, redirecting to login");

    // Clear the invalid token
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");

    return response;
  }

  console.log("✅ Valid token found, allowing access to protected route");

  // Token is valid, allow the request to continue
  const response = NextResponse.next();

  // Add security headers to the response
  response.headers.set("X-Authenticated", "true");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  // Match all paths except static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
