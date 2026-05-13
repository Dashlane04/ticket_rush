import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Home } from "lucide-react";
import { GoBackButton } from "@/components/not-found/GoBackButton";

export const metadata: Metadata = {
  title: "404 — Không tìm thấy | TicketRush",
  description: "Trang không tồn tại",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-6 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-brand-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[480px] w-[480px] rounded-full bg-brand-accent/10 blur-[120px]" />

      <div className="relative z-10 text-center max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-brand-primary transition-colors text-sm mb-8"
        >
          <Ticket className="h-5 w-5 text-brand-primary" />
          TicketRush
        </Link>

        <p className="text-8xl sm:text-9xl font-black tabular-nums text-text-heading/90 tracking-tighter leading-none mb-2">
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-text-heading mb-3">
          Không tìm thấy trang
        </h1>
        <p className="text-text-muted text-sm sm:text-base mb-10 leading-relaxed">
          Đường dẫn này không tồn tại hoặc đã được di chuyển. Kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-white font-semibold shadow-lg shadow-brand-primary/25 hover:bg-brand-primary-hover transition-colors"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <GoBackButton />
        </div>
      </div>
    </div>
  );
}
