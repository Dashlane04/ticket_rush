import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-md p-8">
        <div className="bg-bg-surface/80 backdrop-blur-2xl border border-bg-border rounded-3xl p-8 shadow-2xl">
          <Button variant="link" className="inline-flex items-center gap-2 text-sm text-brand-primary font-medium hover:text-brand-primary-hover mb-6 h-auto p-0" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-text-heading mb-2">Quên mật khẩu</h1>
          <p className="text-text-muted text-sm mb-6">
            Phiên bản demo chưa gửi email khôi phục. Liên hệ quản trị viên hoặc thử tài khoản mẫu trên trang đăng nhập.
          </p>
          <Button className="w-full rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold h-11 shadow-none border-0" asChild>
            <Link href="/login">Về trang đăng nhập</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
