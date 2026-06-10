import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Security headers — wrapper/PWA friendly (no X-Frame-Options DENY). */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  // Camera for WhatsApp QR; geolocation off
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  if (path === "/sw.js") {
    response.headers.set("Service-Worker-Allowed", "/");
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  if (path.startsWith("/app")) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)"],
};
