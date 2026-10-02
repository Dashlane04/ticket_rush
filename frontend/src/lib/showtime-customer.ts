import { backendBaseUrl } from "./server-backend-url";

/** Payload từ Nest GET /tickets/showtimes (một phần). */
export type ShowtimeApiPayload = {
  id: string;
  movieTitle: string;
  theatreName: string;
  hallName: string;
  startTime: string;
  endTime?: string;
  projectionType?: string;
  ageRating?: string;
  totalSeats: number;
  availableSeats: number;
  soldSeats?: number;
  heldSeats?: number;
  description?: string | null;
  bannerImage?: string | null;
  category?: string | null;
  ticketSaleOpensAt?: string | null;
  maxSeatsPerBooking?: number;
};

const GRADIENTS = [
  "bg-emerald-900/20",
  "bg-amber-900/20",
  "bg-slate-800",
  "bg-rose-900/20",
  "bg-cyan-900/20",
  "bg-indigo-900/20",
] as const;

function gradientForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}

function isProbablyUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim()) || s.trim().startsWith("/") || s.trim().startsWith("data:");
}

export function showtimeSaleState(
  s: Pick<ShowtimeApiPayload, "totalSeats" | "availableSeats" | "ticketSaleOpensAt">,
): "available" | "locked" | "sold" {
  const now = Date.now();
  if (s.ticketSaleOpensAt) {
    const openMs = new Date(s.ticketSaleOpensAt).getTime();
    if (!Number.isNaN(openMs) && now < openMs) return "locked";
  }
  if (s.totalSeats === 0) return "locked";
  if (s.availableSeats === 0) return "sold";
  return "available";
}

export function mapShowtimeToEventCard(s: ShowtimeApiPayload) {
  const start = new Date(s.startTime);
  const date = start.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const location = [s.hallName, s.theatreName].filter(Boolean).join(" · ") || s.theatreName || s.hallName;
  const state = showtimeSaleState(s);
  const banner = s.bannerImage?.trim();
  const imageUrl = banner && isProbablyUrl(banner) ? banner : undefined;
  const imageClass = imageUrl ? "" : gradientForId(s.id);

  return {
    id: s.id,
    title: s.movieTitle,
    date,
    location,
    state,
    image: imageClass,
    imageUrl,
    description: (s.description ?? "").trim(),
    priceFrom: "$15.00",
    category: (s.category ?? "").trim() || "Khác",
  };
}

export type FeaturedBannerPayload = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  /** Mốc mở bán vé (ISO); chỉ set khi còn trong tương lai — Hero dùng để countdown. */
  saleStartTime?: string;
  /** Hiển thị ô “Đang mở bán vé” khi không có countdown. */
  ticketsSaleLive?: boolean;
  bannerUrl?: string;
  bannerImageUrl?: string;
};

/** Hero: ưu tiên suất sắp diễn gần nhất (startTime > now), không có thì lấy phần tử đầu sau sort. */
export function pickFeaturedShowtime(showtimes: ShowtimeApiPayload[]): ShowtimeApiPayload | null {
  if (!showtimes.length) return null;
  const now = Date.now();
  const future = showtimes
    .filter((s) => new Date(s.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  if (future.length > 0) return future[0];
  return [...showtimes].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0] ?? null;
}

export function mapShowtimeToFeaturedBanner(s: ShowtimeApiPayload): FeaturedBannerPayload {
  const card = mapShowtimeToEventCard(s);
  const banner = s.bannerImage?.trim();
  const bannerImageUrl = banner && isProbablyUrl(banner) ? banner : undefined;
  const twGradient = "from-slate-800 via-rose-950 to-slate-950";

  const now = Date.now();
  let saleStartTime: string | undefined;
  let ticketsSaleLive = false;
  const opensRaw = s.ticketSaleOpensAt;
  if (!opensRaw) {
    ticketsSaleLive = true;
  } else {
    const openMs = new Date(opensRaw).getTime();
    if (Number.isNaN(openMs)) {
      ticketsSaleLive = true;
    } else if (openMs > now) {
      saleStartTime =
        typeof opensRaw === "string" ? opensRaw : new Date(opensRaw).toISOString();
      ticketsSaleLive = false;
    } else {
      ticketsSaleLive = true;
    }
  }

  return {
    id: s.id,
    title: s.movieTitle,
    subtitle: [s.theatreName, s.hallName].filter(Boolean).join(" · ") || s.projectionType || "",
    description: card.description || "Xem chi tiết và chọn ghế phù hợp với bạn.",
    saleStartTime,
    ticketsSaleLive,
    bannerUrl: bannerImageUrl ? undefined : twGradient,
    bannerImageUrl,
  };
}

export async function fetchShowtimesFromBackend(): Promise<ShowtimeApiPayload[]> {
  const base = backendBaseUrl();
  const res = await fetch(`${base}/tickets/showtimes`, { cache: "no-store" });
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown;
  return Array.isArray(raw) ? (raw as ShowtimeApiPayload[]) : [];
}

export async function fetchShowtimeByIdFromBackend(id: string): Promise<ShowtimeApiPayload | null> {
  const base = backendBaseUrl();
  const res = await fetch(`${base}/tickets/showtimes/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as ShowtimeApiPayload;
}
