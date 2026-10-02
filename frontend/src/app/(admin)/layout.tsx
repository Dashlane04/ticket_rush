"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Inter } from "next/font/google";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAuthStore } from "@/stores/auth-store";
import { userHasAdminRole } from "@/lib/auth-api";
import "@/styles/concur-admin-dashboard.css";
import "@/styles/concur-seat-blueprint.css";

const inter = Inter({ subsets: ["latin"] });

/** Chỉ bỏ qua kiểm tra Admin khi set NEXT_PUBLIC_SKIP_ADMIN_ROLE=true (local / staging có chủ đích). Luôn ép role Admin ở mọi NODE_ENV. */
function skipAdminRoleCheck(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_ADMIN_ROLE === "true";
}

type NavItem = {
  id: string;
  name: string;
  href: string;
  iconClass: string;
  isActive: (pathname: string) => boolean;
};

const primaryNavigation: NavItem[] = [
  {
    id: "events",
    name: "Events",
    href: "/admin/events",
    iconClass: "fa-solid fa-film",
    isActive: (pathname) =>
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname.startsWith("/admin/events"),
  },
  {
    id: "seat-templates",
    name: "Seat Templates",
    href: "/admin/seat-templates",
    iconClass: "fa-solid fa-map",
    isActive: (pathname) => pathname.startsWith("/admin/seat-templates"),
  },
  {
    id: "users",
    name: "Users",
    href: "/admin/users",
    iconClass: "fa-solid fa-users",
    isActive: (pathname) => pathname.startsWith("/admin/users"),
  },
  {
    id: "statistics",
    name: "Statistics",
    href: "/admin/statistics",
    iconClass: "fa-solid fa-chart-line",
    isActive: (pathname) => pathname.startsWith("/admin/statistics"),
  },
];

function routeSectionTitle(pathname: string): string | null {
  const match =
    [...primaryNavigation]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => n.isActive(pathname)) ?? null;
  if (!match || match.id === "events") return null;
  return match.name;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!skipAdminRoleCheck() && !userHasAdminRole(user)) {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  const roleOk = !!user && (skipAdminRoleCheck() || userHasAdminRole(user));

  if (!hydrated || !user || !roleOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-400 text-sm">
        Checking access…
      </div>
    );
  }

  const emailInitial = user?.email?.charAt(0).toUpperCase() ?? "A";
  const sectionHint = routeSectionTitle(pathname);

  return (
    <div className={`cam-admin cam-admin-shell ${inter.className}`}>
      <aside className="sidebar">
        <div className="brand">
          <i className="fa-solid fa-ticket brand-icon text-[20px]" aria-hidden />
          Ticket Rush
        </div>
        <div className="nav-scroll-area">
        <nav className="nav-links">
          {primaryNavigation.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
              >
                <i className={`${item.iconClass} shrink-0 text-[17px] w-[22px]`} aria-hidden />
                {item.name}
              </Link>
            );
          })}
        </nav>
        </div>
        <div className="sidebar-footer px-6">
          <p className="mb-3 flex items-center gap-2 truncate text-[12px] text-slate-500" title={user?.email ?? ""}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#334155] text-[11px] font-bold text-[#cbd5f5]">
              {emailInitial}
            </span>
            <span className="truncate">{user?.email}</span>
          </p>
          <AdminLogoutButton />
        </div>
      </aside>

      <div className="main-content-wrap">
        <div className="main-scroll">
          {sectionHint ? (
            <div className="page-title-bar mb-[-8px]">
              <h2>{sectionHint}</h2>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
