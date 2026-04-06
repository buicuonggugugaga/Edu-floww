import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const session = req.cookies.get("__session")?.value;
  const hasProfile = req.cookies.get("__profile")?.value;

  // API routes - không redirect, để API tự xử lý
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Static files
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Pages công khai (không cần đăng nhập)
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/register");

  if (isPublicPage) {
    // Nếu vào / thì redirect về dashboard
    if (session && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // /login, /register, /onboarding luôn cho vào (không redirect)
    return NextResponse.next();
  }

  // Protected routes: cần đăng nhập
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Đã đăng nhập nhưng chưa có profile → onboarding
  if (!hasProfile && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
