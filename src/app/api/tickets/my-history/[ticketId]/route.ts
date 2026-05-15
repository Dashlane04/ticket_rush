import { NextResponse } from "next/server";
import { upstreamAuthBase } from "@/lib/upstream-auth";
import { resolveAccessTokenFromCookies } from "@/lib/auth-access-token.server";
import { COOKIE_ACCESS, accessCookieOptions } from "@/lib/auth-cookie-settings";

export async function GET(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const resolved = await resolveAccessTokenFromCookies();
  if (!resolved.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const upstream = upstreamAuthBase();
  const nestRes = await fetch(`${upstream}/tickets/my-history/${encodeURIComponent(ticketId)}`, {
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
