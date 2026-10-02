"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { nestFetch } from "@/lib/nest-api";
import { useAuthStore } from "@/stores/auth-store";
import { mapShowtimeToEventCard, type ShowtimeApiPayload } from "@/lib/showtime-customer";
import type { UserTicketRow } from "./MyTicketsList";

type Props = { ticketId: string };

export function TicketDetailClient({ ticketId }: Props) {
  const [row, setRow] = useState<UserTicketRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    setStatus("loading");
    setRow(null);
    setErr(null);
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/tickets/my-history/${encodeURIComponent(ticketId)}`,
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
  }, [ticketId, hydrated, user, router]);

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

  const isExpired = st ? new Date(st.startTime).getTime() < Date.now() : false;
  const qrUrl = row.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`TicketRush:${row.id.toUpperCase()}`)}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-lg">
      <Link
        href="/my-tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách vé
      </Link>

      <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${isExpired ? 'opacity-75' : ''}`}>
        <div className={`h-32 ${headerClass} relative ${isExpired ? 'grayscale' : ''}`} style={headerStyle}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
          <p className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg leading-snug flex items-center justify-between">
            {title}
            {isExpired && (
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-1 rounded bg-rose-600/80 text-white border border-rose-500">
                Expired
              </span>
            )}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Mã vé</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{row.id.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Suất chiếu</span>
            <span className="font-medium text-slate-900 dark:text-white">{st ? formatDate(st.startTime) : "Không xác định"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Ghế</span>
            <span className="font-medium text-slate-900 dark:text-white">{row.seatId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Giá vé</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {row.price === 0 || row.price === "0" ? "Miễn phí" : (Number(row.price) < 1000 ? Number(row.price) * 25000 : Number(row.price)).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Ngày mua</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatDate(row.createdAt)}</span>
          </div>
          
          <div className={`flex flex-col items-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden`}>
            {isExpired && (
              <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <QrCode className="h-12 w-12 text-slate-400 mb-2 opacity-50" />
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Vé Đã Hết Hạn</span>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Ticket QR" width={180} height={180} className={`rounded-lg mb-4 ${isExpired ? 'opacity-20' : ''}`} />
            <span className="text-xs text-slate-500">QR check-in</span>
          </div>
          <p className="text-center text-xs text-slate-500">
            {isExpired ? "Vé này đã qua thời gian sử dụng." : "Trình mã này tại cổng vào sự kiện."}
          </p>
          {!isExpired && (
            <button
              type="button"
              onClick={() => {
                const printWin = window.open("", "_blank", "width=480,height=700");
                if (!printWin) return;
                printWin.document.write(`
                  <!DOCTYPE html><html><head><title>Ticket - ${title}</title>
                  <style>
                    body { font-family: sans-serif; padding: 32px; max-width: 380px; margin: 0 auto; color: #111; }
                    h1 { font-size: 22px; margin-bottom: 4px; }
                    p { margin: 4px 0; font-size: 14px; color: #555; }
                    .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                    .label { color: #888; } .val { font-weight: 600; }
                    img { display: block; margin: 24px auto 8px; }
                    .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 16px; }
                  </style></head><body>
                  <h1>${title}</h1>
                  <p style="color:#e11d48;font-weight:600;margin-bottom:16px;">Ticket Rush</p>
                  <div class="row"><span class="label">Ticket ID</span><span class="val">${row!.id.toUpperCase()}</span></div>
                  <div class="row"><span class="label">Seat</span><span class="val">${row!.seatId}</span></div>
                  <div class="row"><span class="label">Showtime</span><span class="val">${st ? formatDate(st.startTime) : "—"}</span></div>
                  <div class="row"><span class="label">Hall</span><span class="val">${st ? (st as any).hallName ?? "—" : "—"}</span></div>
                  <img src="${qrUrl}" width="180" height="180" alt="QR" />
                  <p style="text-align:center;font-size:12px;">Scan at the gate</p>
                  <div class="footer">Generated by Ticket Rush &bull; ${new Date().toLocaleString("vi-VN")}</div>
                  <script>window.onload=()=>window.print();<\/script>
                  </body></html>`);
                printWin.document.close();
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              In / Tải vé
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
