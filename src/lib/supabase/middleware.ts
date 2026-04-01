import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const protectedPaths = [
      "/dashboard",
      "/autopilot",
      "/ideas",
      "/scripts",
      "/create",
      "/videos",
      "/scheduler",
      "/calendar",
      "/analytics",
      "/settings",
    ];

    const isProtected = protectedPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    );

    const isAuthPage =
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/signup");

    // Redirect unauthenticated users to login, preserving intended destination
    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (e) {
    // If Supabase auth fails, allow the request through
    // rather than crashing the middleware
    console.error("Middleware auth error:", e);
  }

  return supabaseResponse;
}
