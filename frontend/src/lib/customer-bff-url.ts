/**
 * URL gốc của Next Route Handlers khách (`/api/v1/*`), phải trùng origin với app Next.
 * Mặc định cổng 3001 khớp `next dev -p 3001` trong package.json.
 * Production: đặt NEXT_PUBLIC_API_BASE_URL (vd https://ticketrush.com/api/v1).
 */
export function customerBffBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://127.0.0.1:3001/api/v1";
}
