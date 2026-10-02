import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  clearCookieOptions,
} from "@/lib/auth-cookie-settings";

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(COOKIE_REFRESH)?.value;
  const upstream = upstreamAuthBase();

  if (refreshToken) {
    await fetch(`${upstream}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  const clear = clearCookieOptions();
  res.cookies.set(COOKIE_ACCESS, "", clear);
  res.cookies.set(COOKIE_REFRESH, "", clear);
  return res;
}
