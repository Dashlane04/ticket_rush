import Link from "next/link";
import { Calendar, MapPin, Pencil, LayoutGrid } from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock-events";

export default function AdminEventsListPage() {
  return (
    <div className="space-y-6">
      <p className="text-slate-600 text-sm">
        Quản lý sự kiện (dữ liệu mock từ <code className="text-rose-600">@/lib/mock-events</code>).
      </p>
      <div className="grid gap-4">
        {MOCK_EVENTS.map((ev) => (
          <div
            key={ev.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`h-16 w-24 rounded-lg shrink-0 ${ev.image}`} />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 truncate">{ev.title}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {ev.date}
                </span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase text-slate-400">{ev.state}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/admin/events/${ev.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Chi tiết
              </Link>
              <Link
                href={`/admin/events/${ev.id}/seat-map`}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
              >
                <LayoutGrid className="h-4 w-4" />
                Sơ đồ ghế
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
