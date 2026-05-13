"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { notFound } from "next/navigation";
import { nestFetch } from "@/lib/nest-api";
import { getOrCreateTabUserId } from "@/lib/concur/tab-user-id";
import { mapShowtimeToEventCard, type ShowtimeApiPayload } from "@/lib/showtime-customer";
import type { UserTicketRow } from "./MyTicketsList";

type Props = { ticketId: string };

export function TicketDetailClient({ ticketId }: Props) {
  const [row, setRow] = useState<UserTicketRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    setRow(null);
    setErr(null);
    const userId = getOrCreateTabUserId();
    if (userId === "USER-SERVER") {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await nestFetch(
          `tickets/user/${encodeURIComponent(userId)}/ticket/${encodeURIComponent(ticketId)}`,
        );
        if (res.status === 404) {
          if (!cancelled) setStatus("missing");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as UserTicketRow;
        if (!cancelled) {
          setRow(data);
          setStatus("ok");
        }
      } catch {
        if (!cancelled) {
          setErr("Không tải được thông tin vé.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (status === "loading") {
    return <div className="py-12 text-center text-slate-500">Đang tải…</div>;
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 md:px-8 max-w-lg py-8">
        <Link
          href="/my-tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách vé
        </Link>
        <p className="text-amber-600">{err}</p>
      </div>
    );
  }

  if (status === "missing" || !row) {
    notFound();
  }

  const st = row.showtime as ShowtimeApiPayload | null;
  const card = st ? mapShowtimeToEventCard(st) : null;
  const title = st?.movieTitle ?? "Suất chiếu";
  const headerClass = card?.imageUrl ? "" : (card?.image ?? "bg-slate-800");
  const headerStyle =
    card?.imageUrl ?
      {
        backgroundImage: `url(${card.imageUrl})`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
      }
    : undefined;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-lg">
      <Link
        href="/my-tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách vé
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className={`h-32 ${headerClass} relative`} style={headerStyle}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
          <p className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg leading-snug">{title}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Mã vé</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{row.id.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Ghế</span>
            <span className="font-medium text-slate-900 dark:text-white">{row.seatId}</span>
          </div>
          <div className="flex flex-col items-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
            <QrCode className="h-24 w-24 text-slate-400 mb-2" />
            <span className="text-xs text-slate-500">QR check-in</span>
          </div>
          <p className="text-center text-xs text-slate-500">Trình mã này tại cổng vào sự kiện.</p>
        </div>
      </div>
    </div>
  );
}
