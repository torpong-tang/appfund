import { NextResponse } from "next/server";

const SESSION_COOKIE = "appfund_session";
const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/public"];

function normalizeAppPath(pathname) {
  if (pathname === "/appfund") return "/";
  if (pathname.startsWith("/appfund/")) return pathname.slice("/appfund".length);
  return pathname;
}

export function proxy(request) {
  const appPath = normalizeAppPath(request.nextUrl.pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => appPath.startsWith(prefix));

  if (PUBLIC_PATHS.has(appPath) || isPublicApi) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/appfund/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/members/:path*", "/api/:path*"],
};
