import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error("[proxy] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const path = req.nextUrl.pathname;
    if (
      path.startsWith("/backtests") ||
      path.startsWith("/admin") ||
      path.startsWith("/demos") ||
      path.startsWith("/fingerprinting")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      // Nunca mutar req.cookies no Next — pode lançar e originar 500 (Vercel).
      // Padrão Supabase SSR: apenas res.cookies.set.
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        } catch (e) {
          console.error("[proxy] res.cookies.set failed", e);
        }
      },
    },
  });

  let session: Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"] = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (e) {
    console.error("[proxy] getSession failed", e);
    session = null;
  }

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/signup");

  // Redirect unauthenticated users to login
  if (
    !session &&
    (req.nextUrl.pathname.startsWith("/backtests") ||
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/fingerprinting") ||
      req.nextUrl.pathname.startsWith("/demos"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/backtests/historico", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/backtests/:path*", "/admin/:path*", "/demos/:path*", "/fingerprinting/:path*", "/login", "/signup"],
};
