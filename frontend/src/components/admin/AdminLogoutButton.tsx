"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { logoutRequest } from "@/lib/auth-api";

export function AdminLogoutButton() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);

  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          try {
            await logoutRequest();
          } catch {
            /* ignore */
          }
          clearUser();
          router.push("/login");
        })();
      }}
      className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
    >
      <LogOut className="mr-3 h-5 w-5 text-slate-400" />
      Đăng xuất
    </button>
  );
}
