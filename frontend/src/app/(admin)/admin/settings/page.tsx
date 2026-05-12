import Link from "next/link";
import { Bell, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-slate-600">
        Cấu hình hệ thống (demo). Kết nối form thật và API khi backend sẵn sàng.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Thông báo</h2>
            <p className="mt-1 text-sm text-slate-600">Bật email khi có đơn vé mới hoặc sự kiện sắp diễn ra.</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Bảo mật</h2>
            <p className="mt-1 text-sm text-slate-600">2FA và phiên đăng nhập — placeholder.</p>
            <Link href="/login" className="mt-3 inline-block text-sm font-medium text-rose-600 hover:text-rose-700">
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
