import Link from 'next/link';
import { Calendar, ChevronRight, Ticket } from 'lucide-react';
import { MOCK_EVENTS } from '@/lib/mock-events';

const DEMO_TICKETS = MOCK_EVENTS.filter((e) => e.state !== 'sold').slice(0, 3);

export default function MyTicketsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Vé của tôi</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">Dữ liệu demo — gắn API sau.</p>

      <ul className="space-y-3">
        {DEMO_TICKETS.map((ev) => (
          <li key={ev.id}>
            <Link
              href={`/my-tickets/ticket-${ev.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-400/60 hover:shadow-md transition-all group"
            >
              <div className={`h-14 w-14 rounded-xl shrink-0 ${ev.image} flex items-center justify-center`}>
                <Ticket className="h-6 w-6 text-white/90" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors truncate">
                  {ev.title}
                </p>
                <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {ev.date}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-rose-500 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-slate-500">
        Chưa có vé?{' '}
        <Link href="/events" className="text-rose-600 font-medium hover:underline">
          Khám phá sự kiện
        </Link>
      </p>
    </div>
  );
}
