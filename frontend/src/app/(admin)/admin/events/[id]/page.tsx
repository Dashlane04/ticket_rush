import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { getMockEventById } from "@/lib/mock-events";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getMockEventById(id);
  if (!event) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả sự kiện
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        <p className="text-slate-600 text-sm leading-relaxed">{event.description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/admin/events/${event.id}/seat-map`}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
          >
            <LayoutGrid className="h-4 w-4" />
            Chỉnh sơ đồ ghế
          </Link>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xem trang khách
          </Link>
        </div>
      </div>
    </div>
  );
}
