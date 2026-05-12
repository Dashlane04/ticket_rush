import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, QrCode } from 'lucide-react';
import { getMockEventById } from '@/lib/mock-events';

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const match = /^ticket-(.+)$/.exec(ticketId);
  const eventId = match?.[1];
  if (!eventId) notFound();
  const event = getMockEventById(eventId);
  if (!event) notFound();

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
        <div className={`h-32 ${event.image} relative`}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
          <p className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg leading-snug">{event.title}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Mã vé (demo)</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{ticketId.toUpperCase()}</span>
          </div>
          <div className="flex flex-col items-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
            <QrCode className="h-24 w-24 text-slate-400 mb-2" />
            <span className="text-xs text-slate-500">QR check-in (mock)</span>
          </div>
          <p className="text-center text-xs text-slate-500">Trình mã này tại cổng vào sự kiện.</p>
        </div>
      </div>
    </div>
  );
}
