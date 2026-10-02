/** URL NestJS (server-only ưu tiên). */
export function upstreamAuthBase(): string {
  return (
    process.env.TICKET_RUSH_API_URL ??
    process.env.NEXT_PUBLIC_TICKET_RUSH_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "") + "/api";
}
