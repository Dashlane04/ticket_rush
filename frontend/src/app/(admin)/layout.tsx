"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BarChart3, Settings, LogOut, Ticket } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { name: "Sự kiện", href: "/admin/events", icon: CalendarDays },
    { name: "Thống kê", href: "/admin/analytics", icon: BarChart3 },
    { name: "Cài đặt", href: "/admin/settings", icon: Settings },
  ];

  return (
    // Admin uses light mode base
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Ticket className="h-6 w-6 text-rose-600 mr-2" />
          <span className="text-xl font-bold text-slate-900">TicketRush<span className="text-rose-600">Admin</span></span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? "text-rose-600" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-slate-400" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {navigation.find(n => pathname === n.href || (pathname.startsWith(n.href) && n.href !== "/admin"))?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                AD
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-slate-700">Admin User</p>
                <p className="text-slate-500 text-xs">admin@ticketrush.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
