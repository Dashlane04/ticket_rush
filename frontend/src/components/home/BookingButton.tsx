"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BookingButton({ eventId }: { eventId: string }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (hydrated && !user) {
      e.preventDefault();
      toast.error("Vui lòng đăng nhập để đặt vé", {
        description: "Bạn cần có tài khoản để tiếp tục giao dịch.",
      });
      router.push(`/login?redirect=/booking/${eventId}`);
    }
  };

  return (
    <Link
      href={`/booking/${eventId}`}
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full transition-colors shadow-lg shadow-rose-600/25"
    >
      <Ticket className="h-5 w-5" />
      Chọn ghế &amp; mua vé
    </Link>
  );
}
