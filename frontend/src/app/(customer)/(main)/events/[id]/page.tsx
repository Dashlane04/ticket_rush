import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Ticket } from "lucide-react";
import { fetchShowtimeByIdFromBackend, mapShowtimeToEventCard, showtimeSaleState } from "@/lib/showtime-customer";
import BookingButton from "@/components/home/BookingButton";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const st = await fetchShowtimeByIdFromBackend(id);
  if (!st) return { title: "Không tìm thấy sự kiện" };
  return { title: st.movieTitle };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const st = await fetchShowtimeByIdFromBackend(id);
  if (!st) notFound();
  const event = mapShowtimeToEventCard(st);
  const saleState = showtimeSaleState(st);
  const canBook = saleState === "available";
  const opensUtc =
    st.ticketSaleOpensAt && saleState === "locked" ?
      new Date(st.ticketSaleOpensAt).toUTCString()
    : null;

  const headerBgStyle =
    event.imageUrl ?
      { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover" as const, backgroundPosition: "center" as const }
    : undefined;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-4xl">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div
          className={`h-56 md:h-72 ${event.imageUrl ? "" : event.image} relative`}
          style={headerBgStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/20 text-white backdrop-blur-sm border border-white/30">
                {event.state === "available" && "Đang bán"}
                {event.state === "locked" && "Sắp mở bán"}
                {event.state === "sold" && "Hết vé"}
              </span>
              {event.category ?
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-black/35 text-white backdrop-blur-sm border border-white/25">
                  {event.category}
                </span>
              : null}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{event.title}</h1>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{event.location}</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Giá từ</p>
              <p className="text-2xl font-bold text-rose-600">{event.priceFrom}</p>
              {(st.projectionType || st.ageRating) ?
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  {[st.projectionType, st.ageRating].filter(Boolean).join(" · ")}
                </p>
              : null}
            </div>
          </div>

          {opensUtc ?
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/80 rounded-xl px-4 py-3">
              Vé mở bán theo giờ chuẩn quốc tế (UTC):{" "}
              <span className="font-mono text-xs sm:text-sm">{opensUtc}</span>
            </p>
          : null}

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{event.description || "—"}</p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            {canBook ?
              <BookingButton eventId={event.id} />
            : saleState === "locked" ?
              <span className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold cursor-not-allowed border border-amber-200 dark:border-amber-800">
                Vé chưa mở bán
              </span>
            : <span className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold cursor-not-allowed">
                Đã hết vé
              </span>
            }
            <Link
              href="/my-tickets"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:border-rose-400 hover:text-rose-600 transition-colors"
            >
              Vé của tôi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
