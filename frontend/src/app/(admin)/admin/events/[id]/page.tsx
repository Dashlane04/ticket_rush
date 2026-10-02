import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAdminEvent } from "@/lib/admin-showtime-server";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventRow = await fetchAdminEvent(id);
  if (!eventRow) notFound();

  const start = new Date(eventRow.startTime);

  return (
    <div className="cam-event-detail-wrap">
      <Link href="/admin/events" className="cam-back-link">
        <i className="fa-solid fa-arrow-left" aria-hidden />
        All events
      </Link>
      <section className="table-container cam-event-detail-card">
        <h1>{eventRow.movieTitle}</h1>
        <p className="cam-event-meta-id">{eventRow.id}</p>
        <p className="cam-event-meta-id">
          {eventRow.hallName}
          {eventRow.theatreName ? ` · ${eventRow.theatreName}` : ""}
        </p>
        <p className="cam-event-meta-id">
          {start.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <p className="cam-event-desc">{eventRow.description?.trim() || "No description."}</p>
        <div className="cam-event-detail-actions">
          <Link href={`/admin/events/${id}/seat-map`} className="btn-primary btn-link-concur">
            <i className="fa-solid fa-map" aria-hidden />
            Seat blueprint editor
          </Link>
          <Link href={`/events/${id}`} className="btn-secondary btn-link-concur">
            Customer event page
          </Link>
        </div>
      </section>
    </div>
  );
}
