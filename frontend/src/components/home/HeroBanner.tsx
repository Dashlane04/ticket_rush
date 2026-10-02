'use client';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export type FeaturedEventBanner = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  bannerUrl?: string;
  /** Absolute or site-relative image URL from showtime banner. */
  bannerImageUrl?: string;
  /** Mốc mở bán vé (ISO); chỉ khi trong tương lai. */
  saleStartTime?: string;
  /** Hiển thị ô “Đang mở bán vé” khi không countdown. */
  ticketsSaleLive?: boolean;
};

function splitMs(distance: number) {
  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true as const };
  }
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false as const };
}

export default function HeroBanner({ featuredEvent }: { featuredEvent: FeaturedEventBanner | null }) {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  const saleIso = featuredEvent?.saleStartTime;

  const countdownParts = useMemo(() => {
    if (!saleIso) return null;
    const distance = new Date(saleIso).getTime() - Date.now();
    return splitMs(distance);
  }, [saleIso, tick]);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!saleIso) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [saleIso]);

  const utcLabel = saleIso ? new Date(saleIso).toUTCString() : null;

  const showCountdown =
    mounted &&
    !!saleIso &&
    countdownParts &&
    !countdownParts.expired;

  const showLiveSaleCard =
    mounted &&
    featuredEvent?.ticketsSaleLive &&
    (!saleIso || (countdownParts?.expired ?? false));

  if (!featuredEvent) return null;

  const badgeLabel =
    showCountdown ? 'Sắp mở bán vé' : featuredEvent.ticketsSaleLive ? 'Đang mở bán vé' : 'Sự kiện nổi bật';

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-16 group">
      {featuredEvent.bannerImageUrl ?
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredEvent.bannerImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/65 transition-opacity group-hover:bg-slate-900/55" />
        </>
      : <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${featuredEvent.bannerUrl || "from-slate-800 via-rose-950 to-slate-950"} opacity-90 transition-transform duration-700 group-hover:scale-105`}
        />
      }

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-12 md:p-16 max-w-7xl mx-auto h-full min-h-[400px] gap-8">

        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            {badgeLabel}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {featuredEvent.title} <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
              {featuredEvent.subtitle}
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto md:mx-0">
            {featuredEvent.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
             <Link
               href={`/events/${featuredEvent.id}`}
               className="inline-flex items-center justify-center px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_0_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_0_rgba(225,29,72,0.6)] hover:-translate-y-0.5 cursor-pointer"
             >
               Chi tiết Sự kiện
               <ArrowRight className="ml-2 h-5 w-5" />
             </Link>
          </div>
        </div>

        {showCountdown && countdownParts && utcLabel ? (
          <div className="w-full md:w-auto p-6 md:p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl shrink-0">
             <div className="text-center mb-4">
               <h3 className="text-sm uppercase tracking-widest text-rose-200 font-semibold mb-1">Mở bán vé trong</h3>
               <div className="flex flex-col items-center gap-1 text-slate-300">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="text-xs">Theo giờ chuẩn quốc tế (UTC)</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-mono text-slate-400 max-w-[280px] break-words">{utcLabel}</span>
               </div>
             </div>

             <div className="flex items-center justify-center gap-2 md:gap-4 text-white flex-wrap">
                <div className="flex flex-col items-center min-w-[3rem]">
                   <div className="text-2xl md:text-5xl font-black font-mono">{String(countdownParts.days).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Ngày</div>
                </div>
                <div className="text-2xl md:text-5xl font-light text-rose-500/50">:</div>
                <div className="flex flex-col items-center min-w-[3rem]">
                   <div className="text-2xl md:text-5xl font-black font-mono">{String(countdownParts.hours).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Giờ</div>
                </div>
                <div className="text-2xl md:text-5xl font-light text-rose-500/50">:</div>
                <div className="flex flex-col items-center min-w-[3rem]">
                   <div className="text-2xl md:text-5xl font-black font-mono">{String(countdownParts.minutes).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Phút</div>
                </div>
                <div className="text-2xl md:text-5xl font-light text-rose-500/50">:</div>
                <div className="flex flex-col items-center min-w-[3rem]">
                   <div className="text-2xl md:text-5xl font-black font-mono">{String(countdownParts.seconds).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Giây</div>
                </div>
             </div>
          </div>
        ) : null}

        {showLiveSaleCard ? (
          <div className="w-full md:w-auto p-6 md:p-8 rounded-2xl bg-emerald-500/15 backdrop-blur-xl border border-emerald-400/25 shadow-2xl shrink-0 text-center max-w-sm">
            <p className="text-sm uppercase tracking-widest text-emerald-200 font-semibold mb-2">Vé đang mở bán</p>
            <p className="text-sm text-slate-300 mb-4">Chọn ghế và thanh toán ngay trên trang chi tiết.</p>
            <Link
              href={`/events/${featuredEvent.id}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
            >
              Xem &amp; đặt vé
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
