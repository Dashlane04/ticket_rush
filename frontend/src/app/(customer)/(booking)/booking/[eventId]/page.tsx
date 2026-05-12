import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getMockEventById } from '@/lib/mock-events';

export default async function BookingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getMockEventById(eventId);
  if (!event) notFound();

  if (event.state === 'sold') {
    return (
      <div className="container mx-auto px-4 md:px-8 max-w-2xl py-8">
        <p className="text-slate-700 dark:text-slate-300 mb-4">Sự kiện này đã hết vé.</p>
        <Link href={`/events/${eventId}`} className="text-rose-600 font-medium hover:underline">
          Xem chi tiết sự kiện
        </Link>
      </div>
    );
  }

  const orderId = `ord-${eventId}-demo`;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-2xl">
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Chi tiết sự kiện
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chọn vé</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{event.title}</p>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Demo: sơ đồ ghế sẽ gắn vào đây (admin seat-map).</p>
          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Khu standard — {event.priceFrom}
            </li>
            <li className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              VIP (mock, chưa chọn)
            </li>
          </ul>
        </div>

        <Link
          href={`/checkout/${orderId}`}
          className="block w-full text-center py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
        >
          Tiếp tục thanh toán
        </Link>
      </div>
    </div>
  );
}
