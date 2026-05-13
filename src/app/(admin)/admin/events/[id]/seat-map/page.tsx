import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatBlueprintEditor } from "@/components/concur/SeatBlueprintEditor";
import { fetchAdminEvent } from "@/lib/admin-showtime-server";

export default async function AdminSeatMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventRow = await fetchAdminEvent(id);
  if (!eventRow) notFound();

  return (
    <div className="cam-blueprint w-full min-w-0">
      <div className="bp-top-links">
        <Link href={`/admin/events/${id}`}>
          <i className="fa-solid fa-arrow-left" aria-hidden />
          Back to event
        </Link>
        <Link href="/admin/events">All events</Link>
      </div>
      <SeatBlueprintEditor eventLabel={eventRow.movieTitle} />
    </div>
  );
}
