'use client';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HeroBanner({ featuredEvent }: { featuredEvent: any }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!featuredEvent?.saleStartTime) return;
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(featuredEvent.saleStartTime).getTime() - now;
      
      if (distance < 0) return { days: 0, hours: 0, minutes: 0 };
      
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      };
    };

    // Initial calc
    setTimeLeft(calculateTime());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 60000); // update every minute instead of second to save performance since we only show minutes
    
    return () => clearInterval(interval);
  }, [featuredEvent]);

  if (!featuredEvent) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-16 group">
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${featuredEvent.bannerUrl || 'from-slate-800 via-rose-950 to-slate-950'} opacity-90 transition-transform duration-700 group-hover:scale-105`} />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-12 md:p-16 max-w-7xl mx-auto h-full min-h-[400px] gap-8">
        
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Sắp mở bán - Độc quyền
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

        {/* Countdown Card (Glassmorphism) */}
        {mounted && featuredEvent.saleStartTime && (
          <div className="w-full md:w-auto p-6 md:p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl shrink-0">
             <div className="text-center mb-4">
               <h3 className="text-sm uppercase tracking-widest text-rose-200 font-semibold mb-1">Mở bán vé trong</h3>
               <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Theo giờ chuẩn quốc tế</span>
               </div>
             </div>
             
             <div className="flex items-center justify-center gap-4 text-white">
                <div className="flex flex-col items-center">
                   <div className="text-3xl md:text-5xl font-black font-mono">{String(timeLeft.days).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Ngày</div>
                </div>
                <div className="text-3xl md:text-5xl font-light text-rose-500/50">:</div>
                <div className="flex flex-col items-center">
                   <div className="text-3xl md:text-5xl font-black font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Giờ</div>
                </div>
                <div className="text-3xl md:text-5xl font-light text-rose-500/50">:</div>
                <div className="flex flex-col items-center">
                   <div className="text-3xl md:text-5xl font-black font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div>
                   <div className="text-xs md:text-sm text-slate-400 font-medium">Phút</div>
                </div>
             </div>
          </div>
        )}
      </div>
    </section>
  );
}
