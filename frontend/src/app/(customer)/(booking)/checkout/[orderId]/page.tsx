import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const decoded = decodeURIComponent(orderId);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`TicketRush:${decoded}`)}`;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-lg py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment successful</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Order <span className="font-mono font-medium text-slate-900">{decoded}</span>
          </p>
        </div>
        <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="Ticket QR" width={180} height={180} className="rounded-lg" />
        </div>
        <p className="text-xs text-slate-500">Show this QR at the venue entrance.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/my-tickets"
            className="inline-flex justify-center px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            My tickets
          </Link>
          <Link
            href="/events"
            className="inline-flex justify-center px-6 py-3 rounded-full border border-slate-300 text-slate-700 font-medium hover:border-indigo-400 transition-colors"
          >
            Browse events
          </Link>
        </div>
      </div>
    </div>
  );
}
