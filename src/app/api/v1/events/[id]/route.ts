import { NextResponse } from "next/server";
import { fetchShowtimeByIdFromBackend, mapShowtimeToEventCard } from "@/lib/showtime-customer";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const st = await fetchShowtimeByIdFromBackend(id);
  if (!st) {
    return NextResponse.json({ success: false, error: "Không tìm thấy sự kiện" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: mapShowtimeToEventCard(st) });
}
