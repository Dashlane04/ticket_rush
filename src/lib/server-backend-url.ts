/**
 * URL Nest cho Server Components / Route Handlers (không đi qua rewrite `/api/nest` của browser).
 */
export function backendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ??
    process.env.TICKET_RUSH_API_URL ??
    process.env.NEXT_PUBLIC_TICKET_RUSH_API_URL ??
    "http://127.0.0.1:3000";
  return raw.replace(/\/$/, "");
}
