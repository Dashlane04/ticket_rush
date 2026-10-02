import { NextResponse } from "next/server";
import { extractTokenPair } from "@/lib/token-pair";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookie-settings";

function nestMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Đã xảy ra lỗi";
  const msg = (body as { message?: unknown }).message;
  if (Array.isArray(msg) && msg[0] && typeof msg[0] === "string") return msg[0];
  if (typeof msg === "string") return msg;
  return "Đã xảy ra lỗi";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const upstream = upstreamAuthBase();

  const authRes = await fetch(`${upstream}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const authJson = await authRes.json().catch(() => ({}));
  if (!authRes.ok) {
    return NextResponse.json(authJson, { status: authRes.status });
  }

  const pair = extractTokenPair(authJson);
  if (!pair) {
    return NextResponse.json(
      { message: "Upstream không trả đủ access_token và refresh_token" },
      { status: 502 },
    );
  }

  const meRes = await fetch(`${upstream}/auth/me`, {
    headers: { Authorization: `Bearer ${pair.access_token}` },
  });
  const meJson = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    return NextResponse.json(
      { message: nestMessage(meJson) || "Không lấy được thông tin user" },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ user: meJson });
  res.cookies.set(COOKIE_ACCESS, pair.access_token, accessCookieOptions());
  res.cookies.set(COOKIE_REFRESH, pair.refresh_token, refreshCookieOptions());
  return res;
}
