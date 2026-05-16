/**
 * Canonical VND currency formatter for Ticket Rush.
 *
 * Seat prices are stored in the database as small decimal values
 * (e.g. 15.00, 40.00, 65.00). The booking layer converts them to
 * Vietnamese Đồng by multiplying by 25,000 before display.
 * Any value already in VND range (≥ 1,000) is formatted as-is.
 *
 * Usage:
 *   formatVND(15)      → "375.000 ₫"
 *   formatVND(375000)  → "375.000 ₫"
 */
export function formatVND(rawPrice: number): string {
  const vnd = rawPrice < 1_000 ? rawPrice * 25_000 : rawPrice;
  return vnd.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}
