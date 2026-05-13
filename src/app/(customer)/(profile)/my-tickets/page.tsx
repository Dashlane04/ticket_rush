import Link from "next/link";
import { MyTicketsList } from "@/components/my-tickets/MyTicketsList";

export default function MyTicketsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Vé của tôi</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
        Vé đã mua trong phiên trình duyệt này (cùng ID phiên tab với trang đặt vé).
      </p>

      <MyTicketsList />

      <p className="mt-8 text-center text-sm text-slate-500">
        Chưa có vé?{" "}
        <Link href="/events" className="text-rose-600 font-medium hover:underline">
          Khám phá sự kiện
        </Link>
      </p>
    </div>
  );
}
