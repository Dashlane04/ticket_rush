"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Ticket } from "lucide-react";
import { nestFetch } from "@/lib/nest-api";
import { getOrCreateTabUserId } from "@/lib/concur/tab-user-id";
import { mapShowtimeToEventCard, type ShowtimeApiPayload } from "@/lib/showtime-customer";

export type UserTicketRow = {
  id: string;
  seatId: string;
  showtimeId: string;
  status: string;
  price: number | string;
  createdAt: string;
  showtime: ShowtimeApiPayload | null;
};

export function MyTicketsList() {
  const [items, setItems] = useState<UserTicketRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const userId = getOrCreateTabUserId();
    if (userId === "USER-SERVER") {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await nestFetch(`tickets/user/${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        if (!cancelled) {
          setItems(Array.isArray(data) ? (data as UserTicketRow[]) : []);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Không tải được danh sách vé.");
          setItems([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) {
    return <div className="py-12 text-center text-slate-500">Đang tải…</div>;
  }

  return (
    <>
      {loadError ?
        <p className="text-amber-600 dark:text-amber-400 text-sm mb-4">{loadError}</p>
      : null}
      <ul className="space-y-3">
        {items.length === 0 ?
          <li className="py-8 text-center text-slate-500">Bạn chưa có vé nào trong phiên này.</li>
        : null}
        {items.map((row) => {
          const st = row.showtime;
          const card = st ? mapShowtimeToEventCard(st) : null;
          const title = st?.movieTitle ?? "Suất chiếu";
          const date =
            st ?
              new Date(st.startTime).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          const thumbClass = card?.imageUrl ? "" : (card?.image ?? "bg-slate-800");
          const thumbStyle =
            card?.imageUrl ?
              {
                backgroundImage: `url(${card.imageUrl})`,
                backgroundSize: "cover" as const,
                backgroundPosition: "center" as const,
              }
            : undefined;

          return (
            <li key={row.id}>
              <Link
                href={`/my-tickets/${row.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-400/60 hover:shadow-md transition-all group"
              >
                <div
                  className={`h-14 w-14 rounded-xl shrink-0 ${thumbClass} flex items-center justify-center bg-slate-800`}
                  style={thumbStyle}
                >
                  {!card?.imageUrl ?
                    <Ticket className="h-6 w-6 text-white/90" />
                  : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors truncate">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Ghế {row.seatId}</p>
                  <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {date}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-rose-500 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
