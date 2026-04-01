import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = new Set([
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
]);

const PROTECTED_PREFIXES = ["/dashboard", "/api/payment", "/callback"];
const PROTECTED_EXACT_PATHS = new Set(["/payment"]);

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  return response;
};

const isProtectedPath = (pathname: string) =>
  PROTECTED_EXACT_PATHS.has(pathname) ||
  PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const isAuthenticated = Boolean(token);
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isProtected = isProtectedPath(pathname);

  if (isAuthPage && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";

    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";

    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/payment/:path*",
    "/callback/:path*",
    "/payment",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ],
};
