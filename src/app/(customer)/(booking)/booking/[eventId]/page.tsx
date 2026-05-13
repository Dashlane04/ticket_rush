import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatBookingExperience } from "@/components/concur/SeatBookingExperience";
import { fetchShowtimeByIdFromBackend, mapShowtimeToEventCard, showtimeSaleState } from "@/lib/showtime-customer";

export default async function BookingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const st = await fetchShowtimeByIdFromBackend(eventId);
  if (!st) notFound();

  if (showtimeSaleState(st) === "sold") {
    return (
      <div className="container mx-auto px-4 md:px-8 max-w-2xl py-8">
        <p className="text-slate-700 dark:text-slate-300 mb-4">Sự kiện này đã hết vé.</p>
        <Link href={`/events/${eventId}`} className="text-rose-600 font-medium hover:underline">
          Xem chi tiết sự kiện
        </Link>
      </div>
    );
  }

  const event = mapShowtimeToEventCard(st);
  const showtimeId = st.id;
  const eventMetaLine = `${event.location} • ${event.date}`;

  return (
    <SeatBookingExperience showtimeId={showtimeId} displayTitle={event.title} eventMetaLine={eventMetaLine} />
  );
}
