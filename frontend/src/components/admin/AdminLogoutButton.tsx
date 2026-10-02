"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { logoutRequest } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);

  return (
    <div className="cam-logout-wrap">
      <Button
        type="button"
        variant="ghost"
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
        className="cam-logout-btn gap-2 border-0 shadow-none hover:bg-transparent"
      >
        <i className="fa-solid fa-right-from-bracket" style={{ width: 18, opacity: 0.7 }} aria-hidden />
        Đăng xuất
      </Button>
    </div>
  );
}
