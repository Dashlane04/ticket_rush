import { NextResponse } from "next/server";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import { resolveAccessTokenFromCookies } from "@/lib/auth-access-token.server";
import { COOKIE_ACCESS, accessCookieOptions } from "@/lib/auth-cookie-settings";

export async function POST(req: Request) {
  const resolved = await resolveAccessTokenFromCookies();
  if (!resolved.ok) {
    return NextResponse.json({ message: "Cần đăng nhập để thanh toán." }, { status: 401 });
  }

  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const showtimeId = raw.showtimeId;
  const seatIds = raw.seatIds;
  const promoCode = raw.promoCode;
  if (typeof showtimeId !== "string" || !Array.isArray(seatIds)) {
    return NextResponse.json({ message: "showtimeId và seatIds là bắt buộc." }, { status: 400 });
  }

  const upstream = upstreamAuthBase();
  const nestRes = await fetch(`${upstream}/tickets/purchase`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resolved.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ showtimeId, seatIds, promoCode }),
  });

  const payload = await nestRes.json().catch(() => ({}));
  const out = NextResponse.json(payload, { status: nestRes.status });
  if (resolved.refreshedAccess) {
    out.cookies.set(COOKIE_ACCESS, resolved.refreshedAccess, accessCookieOptions());
  }
  return out;
}
