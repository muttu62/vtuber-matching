import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup", "/terms", "/privacy", "/about", "/explore", "/profile", "/contact", "/auth", "/diagnosis", "/share", "/personality-test"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!session && !isPublic && pathname !== "/") {
    // returnTo を付けることで、ログイン後に元のページへ戻れるようにする
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};