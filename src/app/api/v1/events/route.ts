import { NextResponse } from "next/server";
import { fetchShowtimesFromBackend, mapShowtimeToEventCard } from "@/lib/showtime-customer";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category")?.trim();

  let showtimes = await fetchShowtimesFromBackend();
  if (category && category !== "Tất cả") {
    showtimes = showtimes.filter((st) => (st.category ?? "Khác").trim() === category);
  }

  const data = showtimes.map(mapShowtimeToEventCard);

  return NextResponse.json({
    success: true,
    data,
    pagination: { total: data.length, page: 1, limit: 10 },
  });
}
