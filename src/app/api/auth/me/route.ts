import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieOptions,
  clearCookieOptions,
} from "@/lib/auth-cookie-settings";

export async function GET() {
  const jar = await cookies();
  const accessToken = jar.get(COOKIE_ACCESS)?.value ?? null;
  const refreshToken = jar.get(COOKIE_REFRESH)?.value ?? null;
  const upstream = upstreamAuthBase();

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const fetchMe = (token: string) =>
    fetch(`${upstream}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let res = accessToken ? await fetchMe(accessToken) : new Response(null, { status: 401 });
  let newAccess: string | null = null;

  if (res.status === 401 && refreshToken) {
    const refr = await fetch(`${upstream}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const body = (await refr.json().catch(() => ({}))) as {
      access_token?: string;
      accessToken?: string;
    };
    const na = body.access_token ?? body.accessToken;
    if (refr.ok && typeof na === "string" && na.length > 0) {
      newAccess = na;
      res = await fetchMe(na);
    }
  }

  if (!res.ok) {
    const out = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const clear = clearCookieOptions();
    out.cookies.set(COOKIE_ACCESS, "", clear);
    out.cookies.set(COOKIE_REFRESH, "", clear);
    return out;
  }

  const user = await res.json();
  const response = NextResponse.json(user);
  if (newAccess !== null) {
    response.cookies.set(COOKIE_ACCESS, newAccess, accessCookieOptions());
  }
  return response;
}
