import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/autopilot/:path*",
    "/ideas/:path*",
    "/scripts/:path*",
    "/create/:path*",
    "/videos/:path*",
    "/scheduler/:path*",
    "/calendar/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
