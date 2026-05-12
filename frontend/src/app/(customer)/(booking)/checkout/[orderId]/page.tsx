import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-lg py-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thanh toán (demo)</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
            Đơn hàng <span className="font-mono font-medium text-slate-900 dark:text-white">{orderId}</span> đã được ghi nhận trong luồng mock.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/my-tickets"
            className="inline-flex justify-center px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
          >
            Xem vé của tôi
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center px-6 py-3 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:border-rose-400 transition-colors"
          >
            Tiếp tục mua vé
          </Link>
        </div>
      </div>
    </div>
  );
}
