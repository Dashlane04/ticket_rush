"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { fetchAuthMe } from "@/lib/auth-api";

export function AuthHydrate() {
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const me = await fetchAuthMe();
        if (!cancelled) setUser(me);
      } catch {
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch {
          /* ignore */
        }
        if (!cancelled) clearUser();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [setHydrated, setUser, clearUser]);

  return null;
}
