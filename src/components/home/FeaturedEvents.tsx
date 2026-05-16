import { Calendar, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';

type FeaturedEventsProps = {
  events: {
    id: string;
    title: string;
    date: string;
    location: string;
    state: string;
    category?: string;
    image?: string;
    imageUrl?: string;
  }[];
  sectionTitle?: string;
  showViewAllLink?: boolean;
};

export default function FeaturedEvents({ events, sectionTitle = 'Sự kiện nổi bật', showViewAllLink = true }: FeaturedEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        Không có sự kiện nào trong danh mục này.
      </div>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{sectionTitle}</h2>
        {showViewAllLink ? (
          <Link href="/events" className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer">
            Xem tất cả &rarr;
          </Link>
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">{events.length} sự kiện</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            {/* Image Skeleton */}
            <div
              className={`w-full h-48 ${event.imageUrl ? "bg-slate-800" : (event.image || "bg-slate-800")} relative overflow-hidden flex items-center justify-center`}
              style={
                event.imageUrl ?
                  { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
              {event.category ?
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-black/45 border border-white/25 text-white text-[11px] font-semibold backdrop-blur-md max-w-[min(100%,12rem)] truncate inline-block">
                    {event.category}
                  </span>
                </div>
              : null}
              <div className="absolute top-3 right-3 z-20">
                {event.state === 'available' && <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">Đang bán</span>}
                {event.state === 'locked' && <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-500 text-xs font-bold uppercase tracking-wider backdrop-blur-md">Sắp mở</span>}
                {event.state === 'sold' && <span className="px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/50 text-slate-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">Sold Out</span>}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                  {event.title}
               </h3>

               <div className="mt-auto space-y-2">
                 <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    {event.date}
                 </div>
                 <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate">{event.location}</span>
                 </div>
               </div>

               <div className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {event.state === 'sold' ?
                    <span className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg font-semibold text-center cursor-not-allowed inline-block">
                      Hết vé
                    </span>
                  : event.state === 'locked' ?
                    <span className="w-full py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-lg font-semibold text-center cursor-not-allowed inline-block border border-amber-200/80 dark:border-amber-800/80">
                      Sắp mở bán vé
                    </span>
                  : <span className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 group-hover:bg-rose-600 dark:bg-rose-500/10 dark:group-hover:bg-rose-600 text-rose-600 group-hover:text-white rounded-lg font-semibold transition-colors duration-200">
                      <Ticket className="h-4 w-4" />
                      Mua vé
                    </span>
                  }
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
