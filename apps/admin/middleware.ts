import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Admin Platform Middleware - Authentication and Route Protection
 *
 * This middleware handles:
 * - Authentication checking for admin routes
 * - Redirects unauthenticated users to login
 * - Preserves intended destination for post-login redirect
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (login page, static assets)
  const publicRoutes = ["/login", "/api", "/_next", "/favicon.ico"];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authentication tokens (robust handling for both formats)
  const authTokensJson = request.cookies.get("auth_tokens")?.value;
  const authTokenSingle = request.cookies.get("auth_token")?.value;

  // Validate token presence and format
  let hasValidToken = false;

  try {
    if (authTokensJson) {
      // Try to parse JSON token object (handle URL encoding)
      const decodedTokens = decodeURIComponent(authTokensJson);
      const tokenObj = JSON.parse(decodedTokens);
      hasValidToken = !!(tokenObj.accessToken && tokenObj.expiresAt);

      // Check if token is expired
      if (hasValidToken) {
        const expiryTime = new Date(tokenObj.expiresAt).getTime();
        const now = Date.now();
        const bufferTime = 60 * 1000; // 1 minute buffer
        hasValidToken = now < expiryTime - bufferTime;
      }
    } else if (authTokenSingle) {
      // Simple token string format - basic validation
      hasValidToken = authTokenSingle.length > 20; // Basic length check
    }
  } catch (error) {
    console.warn("🚨 Middleware: Invalid token format, redirecting to login");
    hasValidToken = false;
  }

  console.log("🍪 Middleware: Auth validation", {
    hasAuthTokens: !!authTokensJson,
    hasAuthToken: !!authTokenSingle,
    hasValidToken,
    pathname,
  });

  // If no valid token found, redirect to login with return URL
  if (!hasValidToken) {
    const loginUrl = new URL("/login", request.url);

    // Preserve the intended destination for post-login redirect
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirectTo", pathname);
    }

    console.log(
      `🔒 Admin middleware: Redirecting unauthenticated user to login`
    );
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Add token validation here
  // For now, we trust the presence of the token
  // In production, you'd want to validate the JWT token

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
