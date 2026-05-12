"use client";

import { Search, User, Menu, Ticket, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { logoutRequest } from "@/lib/auth-api";

export default function CustomerHeader() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  const loggedIn = hydrated && !!user;

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* ignore network errors */
    }
    clearUser();
    router.push("/");
  };

  return (
    <header className="fixed top-4 inset-x-4 z-50 mx-auto max-w-7xl rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 items-center">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Ticket className="h-7 w-7 text-rose-600" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Ticket<span className="text-rose-600">Rush</span>
          </span>
        </Link>
        
        {/* Search Bar - hidden on small mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sự kiện..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
            <Search className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/events" className="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-500 transition-colors cursor-pointer">
               Khám phá
            </Link>
            <Link href="/my-tickets" className="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-500 transition-colors cursor-pointer">
               Vé của tôi
            </Link>
          </div>
          {loggedIn ? (
            <>
              <span
                className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300 max-w-[180px] truncate"
                title={user?.email}
              >
                {user?.email}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-full transition-colors duration-200 cursor-pointer shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
