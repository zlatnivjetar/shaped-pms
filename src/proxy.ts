import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

type Session = {
  user: {
    id: string;
    role: "owner" | "manager" | "front_desk";
  };
};

// Routes only owner/manager can access
const MANAGER_ONLY = [
  "/calendar",
  "/rates",
  "/reviews",
  "/settings",
  "/room-types",
  "/rooms",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: { cookie: request.headers.get("cookie") ?? "" },
    }
  );

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role;

  if (
    role === "front_desk" &&
    MANAGER_ONLY.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/reservations/:path*",
    "/guests/:path*",
    "/rates/:path*",
    "/reviews/:path*",
    "/settings/:path*",
    "/room-types/:path*",
    "/rooms/:path*",
  ],
};
