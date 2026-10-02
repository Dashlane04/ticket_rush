import { NextResponse } from "next/server";
import {
  fetchShowtimesFromBackend,
  mapShowtimeToFeaturedBanner,
  pickFeaturedShowtime,
} from "@/lib/showtime-customer";

export async function GET() {
  const showtimes = await fetchShowtimesFromBackend();
  const picked = pickFeaturedShowtime(showtimes);
  const featuredEvents = picked ? [mapShowtimeToFeaturedBanner(picked)] : [];

  return NextResponse.json({ success: true, data: featuredEvents });
}
