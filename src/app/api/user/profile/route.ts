import { NextResponse } from "next/server";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import { resolveAccessTokenFromCookies } from "@/lib/auth-access-token.server";
import { COOKIE_ACCESS, accessCookieOptions } from "@/lib/auth-cookie-settings";

export async function GET() {
  const resolved = await resolveAccessTokenFromCookies();
  if (!resolved.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstream = upstreamAuthBase();
  const nestRes = await fetch(`${upstream}/user/profile/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${resolved.token}`,
    },
  });

  const payload = await nestRes.json().catch(() => ({}));
  const out = NextResponse.json(payload, { status: nestRes.status });
  if (resolved.refreshedAccess) {
    out.cookies.set(COOKIE_ACCESS, resolved.refreshedAccess, accessCookieOptions());
  }
  return out;
}

export async function PUT(req: Request) {
  const resolved = await resolveAccessTokenFromCookies();
  if (!resolved.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const upstream = upstreamAuthBase();
  const nestRes = await fetch(`${upstream}/user/profile/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${resolved.token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const payload = await nestRes.json().catch(() => ({}));
  const out = NextResponse.json(payload, { status: nestRes.status });
  if (resolved.refreshedAccess) {
    out.cookies.set(COOKIE_ACCESS, resolved.refreshedAccess, accessCookieOptions());
  }
  return out;
}
