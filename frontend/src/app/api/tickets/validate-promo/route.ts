import { NextResponse } from "next/server";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import { resolveAccessTokenFromCookies } from "@/lib/auth-access-token.server";
import { COOKIE_ACCESS, accessCookieOptions } from "@/lib/auth-cookie-settings";

export async function POST(req: Request) {
  const resolved = await resolveAccessTokenFromCookies();
  if (!resolved.ok) {
    return NextResponse.json({ message: "Cần đăng nhập để kiểm tra mã khuyến mãi." }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = raw.code;
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ message: "code is required." }, { status: 400 });
  }

  const upstream = upstreamAuthBase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resolved.token}`,
  };

  const nestRes = await fetch(`${upstream}/tickets/validate-promo`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code }),
  });

  const payload = await nestRes.json().catch(() => ({}));
  const out = NextResponse.json(payload, { status: nestRes.status });
  if (resolved.refreshedAccess) {
    out.cookies.set(COOKIE_ACCESS, resolved.refreshedAccess, accessCookieOptions());
  }
  return out;
}
