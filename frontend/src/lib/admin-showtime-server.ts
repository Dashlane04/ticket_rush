import { backendBaseUrl } from "./server-backend-url";

/** Shape JSON từ Nest `GET /admin/events/:id` (alias `GET /admin/showtime/:id`). */
export type AdminEventDetail = {
  id: string;
  movieTitle: string;
  description?: string | null;
  hallName: string;
  theatreName?: string;
  startTime: string;
  endTime?: string;
};

/** @deprecated Use `AdminEventDetail` */
export type AdminShowtimePayload = AdminEventDetail;

export async function fetchAdminEvent(id: string): Promise<AdminEventDetail | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}/admin/events/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminEventDetail;
  } catch {
    return null;
  }
}

/** @deprecated Use `fetchAdminEvent` */
export async function fetchAdminShowtime(id: string): Promise<AdminShowtimePayload | null> {
  return fetchAdminEvent(id);
}
