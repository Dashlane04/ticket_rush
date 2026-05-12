import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMockEventById } from "@/lib/mock-events";

export default async function AdminSeatMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getMockEventById(id);
  if (!event) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Chi tiết sự kiện
        </Link>
        <Link
          href="/admin/events"
          className="text-sm text-slate-500 hover:text-rose-600"
        >
          Danh sách sự kiện
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-lg font-bold text-slate-900">Sơ đồ ghế — {event.title}</h1>
        <p className="mt-2 text-slate-600 text-sm">
          Vùng canvas chỉnh sửa ghế (demo). Thay bằng editor thật khi tích hợp backend.
        </p>
        <div className="mt-8 h-64 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
          Grid ghế — placeholder
        </div>
      </div>
    </div>
  );
}
