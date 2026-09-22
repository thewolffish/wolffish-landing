import { NextResponse, type NextRequest } from "next/server";

// `?locale=en` and `?locale=ar` on /cloud and /deck.
//
// The site keeps its language in a cookie, which the root layout reads for
// `lang` and `dir` before any page renders. A page cannot set that cookie for
// its own render, so the parameter is handled here: the cookie is rewritten on
// the way in, which makes this render use the requested language, and set on
// the way out, so the rest of the visit stays in it. Nothing is redirected, so
// a shared link keeps its parameter and previews in its own language.
const PARAM = "locale";
const COOKIE = "locale";
const LOCALES = new Set(["en", "ar"]);
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(PARAM);
  if (!requested || !LOCALES.has(requested)) return NextResponse.next();

  request.cookies.set(COOKIE, requested);
  const headers = new Headers(request.headers);
  headers.set("cookie", request.cookies.toString());

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set({
    name: COOKIE,
    value: requested,
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  // Exact paths only. /cloud/playground carries its own locale in the URL and
  // reads it in the route, so it must not be touched here.
  matcher: ["/cloud", "/deck"],
};
