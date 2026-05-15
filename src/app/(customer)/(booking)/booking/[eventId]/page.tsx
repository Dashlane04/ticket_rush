import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatBookingExperience } from "@/components/concur/SeatBookingExperience";
import { fetchShowtimeByIdFromBackend, mapShowtimeToEventCard, showtimeSaleState } from "@/lib/showtime-customer";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params;
  const st = await fetchShowtimeByIdFromBackend(eventId);
  if (!st) return { title: "Không tìm thấy suất chiếu" };
  return { title: `Chọn ghế — ${st.movieTitle}` };
}

export default async function BookingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const st = await fetchShowtimeByIdFromBackend(eventId);
  if (!st) notFound();

  if (showtimeSaleState(st) === "sold") {
    return (
      <div className="container mx-auto px-4 md:px-8 max-w-2xl py-24 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🎫</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Sự kiện đã hết vé</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          Rất tiếc, toàn bộ vé cho sự kiện này đã được bán hết. Vui lòng tham khảo các sự kiện khác đang mở bán.
        </p>
        <div className="flex gap-4">
          <Link href={`/events/${eventId}`} className="px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Xem chi tiết
          </Link>
          <Link href="/events" className="px-6 py-2.5 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
            Khám phá sự kiện
          </Link>
        </div>
      </div>
    );
  }

  const event = mapShowtimeToEventCard(st);
  const showtimeId = st.id;
  const eventMetaLine = `${event.location} • ${event.date}`;

  return (
    <SeatBookingExperience 
      showtimeId={showtimeId} 
      displayTitle={event.title} 
      eventMetaLine={eventMetaLine}
      maxSeatsPerBooking={st.maxSeatsPerBooking} 
    />
  );
}
