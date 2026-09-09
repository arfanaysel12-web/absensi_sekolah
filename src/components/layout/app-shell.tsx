"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  Calendar,
  FileText,
  Bell,
  User,
  Shield,
  Users,
  FileDown,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/absen", label: "Absensi", icon: ClipboardCheck },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/riwayat", label: "Riwayat", icon: History },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/pengajuan-izin", label: "Pengajuan Izin", icon: FileText },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/admin", label: "Admin", icon: Shield, staffOnly: true },
  { href: "/siswa", label: "Kelola Siswa", icon: Users, staffOnly: true },
  { href: "/laporan", label: "Laporan", icon: FileDown, staffOnly: true },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru",
  siswa: "Siswa",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.notifications)) {
          setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          setUser({ name: data.user.name, role: data.user.role });
        }
      })
      .catch(() => {
        // abaikan; arahkan ke login lewat proxy
      });
  }, []);

  const role = user?.role ?? "";
  const visibleNav = NAV_ITEMS.filter((item) => !item.staffOnly || role === "admin" || role === "guru");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const userInitials = user
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">Absensi Siswa</p>
            <p className="text-xs text-zinc-500">XI RPL 1</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {visibleNav.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            const showBadge = item.href === "/notifikasi" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-zinc-400"}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800">{user?.name || "..."}</p>
              <p className="truncate text-xs text-zinc-400">{role ? ROLE_LABEL[role] : ""}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-900">Absensi XI RPL 1</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
          {children}
        </main>

        <nav className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl overflow-x-auto px-2">
            {visibleNav.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              const showBadge = item.href === "/notifikasi" && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-medium shrink-0"
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-zinc-400"}`} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`leading-none ${active ? "text-indigo-600" : "text-zinc-400"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}