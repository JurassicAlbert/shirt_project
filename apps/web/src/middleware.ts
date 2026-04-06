import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isProtectedApiPath = (pathname: string) => {
  if (pathname.startsWith("/api/cart")) return true;
  if (pathname.startsWith("/api/checkout")) return true;
  if (pathname.startsWith("/api/orders")) return true;
  if (pathname.startsWith("/api/returns")) return true;
  if (pathname.startsWith("/api/designs")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/account")) return true;
  if (pathname === "/api/payments/przelewy24/init") return true;
  if (pathname.startsWith("/api/jobs")) return true;
  return false;
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    if (!isProtectedApiPath(pathname)) return NextResponse.next();

    const token = request.cookies.get("session_token")?.value;
    if (!token || !verifySession(token)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(pl|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
