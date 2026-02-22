import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup", "/terms", "/privacy", "/about", "/explore", "/profile"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!session && !isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};