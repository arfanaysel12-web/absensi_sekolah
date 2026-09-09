"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  History,
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Bell,
  AlertTriangle,
  FileText,
  Heart,
} from "lucide-react";
import { formatDateLabel, todayKey } from "@/lib/students";

interface TodayStudent {
  id: string;
  name: string;
  status: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [students, setStudents] = useState<TodayStudent[]>([]);
  const [selfAttendance, setSelfAttendance] = useState<{
    status: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
  } | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [staff, setStaff] = useState(true);

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setUnreadCount((data.notifications as { read: boolean }[]).filter((n) => !n.read).length);
      })
      .catch(() => {});

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setUser({ name: data.user.name, role: data.user.role });
          setStaff(data.user.role === "admin" || data.user.role === "guru");
        }
      })
      .catch(() => {});

    Promise.all([
      fetch("/api/attendance/today", { cache: "no-store" }),
      fetch("/api/attendance/stats", { cache: "no-store" }),
    ])
      .then(async ([todayRes, statsRes]) => {
        const today = await todayRes.json();
        const stat = await statsRes.json();

        if (stat?.success && stat.stats) setStats(stat.stats);

        if (today?.success) {
          if (today.attendanceList) {
            const recordByStudent = new Map<number, any>();
            for (const rec of today.attendanceList) {
              if (rec.student_id) recordByStudent.set(rec.student_id, rec);
            }
            setStudents(
              (today.students || []).map((s: any) => {
                const rec = recordByStudent.get(Number(s.id));
                return {
                  id: String(s.id),
                  name: s.name,
                  status: rec ? rec.status : null,
                  checkInTime: rec ? rec.check_in_time : null,
                  checkOutTime: rec ? rec.check_out_time : null,
                };
              })
            );
          } else if (today.attendance) {
            setSelfAttendance({
              status: today.attendance.status,
              checkInTime: today.attendance.checkInTime,
              checkOutTime: today.attendance.checkOutTime,
            });
          }
        }
      })
      .catch(() => {});

    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStudents = staff ? students : [];
  const myStatus = staff ? null : selfAttendance;

  const hadir =
    staff ? todayStudents.filter((s) => s.status === "hadir").length : (myStatus?.status === "hadir" ? 1 : 0);
  const terlambat =
    staff ? todayStudents.filter((s) => s.status === "terlambat").length : (myStatus?.status === "terlambat" ? 1 : 0);
  const izin = staff ? todayStudents.filter((s) => s.status === "izin").length : (myStatus?.status === "izin" ? 1 : 0);
  const sakit = staff ? todayStudents.filter((s) => s.status === "sakit").length : (myStatus?.status === "sakit" ? 1 : 0);
  const alpha = staff ? todayStudents.filter((s) => s.status === "alpha").length : (myStatus?.status === "alpha" ? 1 : 0);
  const belum =
    staff ? todayStudents.filter((s) => s.status === null).length : (!myStatus ? 1 : 0);
  const total = staff ? todayStudents.length : 1;

  const hadirPct = staff && total > 0 ? Math.round((hadir / total) * 100) : myStatus ? (myStatus.status === "hadir" || myStatus.status === "terlambat" ? 100 : 0) : 0;

  const totalDays = stats.totalDays || 0;
  const attendanceRate = stats.attendanceRate || 0;

  const cards = [
    { label: "Hadir", value: hadir, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200" },
    { label: "Terlambat", value: terlambat, icon: AlertTriangle, cls: "bg-amber-50 text-amber-700", ring: "ring-amber-200" },
    { label: "Izin", value: izin, icon: FileText, cls: "bg-blue-50 text-blue-700", ring: "ring-blue-200" },
    { label: "Sakit", value: sakit, icon: Heart, cls: "bg-purple-50 text-purple-700", ring: "ring-purple-200" },
    { label: "Alpha", value: alpha, icon: XCircle, cls: "bg-red-50 text-red-700", ring: "ring-red-200" },
    { label: "Belum Absen", value: belum, icon: Clock, cls: "bg-zinc-100 text-zinc-700", ring: "ring-zinc-200" },
  ];

  const quickActions = [
    { href: "/absen", title: "Absen Sekarang", desc: "Catat kehadiran hari ini", icon: ClipboardCheck, cls: "from-indigo-500 to-violet-600 text-white" },
    { href: "/riwayat", title: "Lihat Riwayat", desc: "Rekap kehadiran per tanggal", icon: History, cls: "from-emerald-500 to-teal-600 text-white" },
    { href: "/kalender", title: "Kalender", desc: "Lihat kalender kehadiran", icon: Calendar, cls: "from-blue-500 to-cyan-600 text-white" },
    { href: "/pengajuan-izin", title: "Pengajuan Izin", desc: "Ajukan izin atau sakit", icon: FileText, cls: "from-amber-500 to-orange-600 text-white" },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const getGreeting = () => {
    const hour = currentTime?.getHours() ?? 12;
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "hadir": return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Hadir</span>;
      case "terlambat": return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Terlambat</span>;
      case "izin": return <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Izin</span>;
      case "sakit": return <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">Sakit</span>;
      case "alpha": return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">Alpha</span>;
      case "tidak_hadir": return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Tidak Hadir</span>;
      default: return <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">Belum</span>;
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-600/20 sm:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-200">
              {mounted ? formatDateLabel(todayKey()) : "…"}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {getGreeting()}, {user?.name || "..."} 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-indigo-100">
              {staff
                ? "Kelola kehadiran siswa kelas XI RPL 1 dengan mudah dan tersimpan di database."
                : "Pantau kehadiran Anda dan ajukan izin dengan mudah."}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="rounded-2xl bg-white/20 px-4 py-3 text-center backdrop-blur">
              <p className="text-3xl font-bold tabular-nums">{currentTime ? formatTime(currentTime) : "…"}</p>
              <p className="text-xs text-indigo-200">Waktu Sekarang</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{staff ? "Progres absen hari ini" : "Status kamu hari ini"}</span>
            <span>{hadirPct}% hadir</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${hadirPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-indigo-100">
            {staff
              ? `${hadir} hadir, ${terlambat} terlambat, ${izin} izin, ${sakit} sakit dari ${total} siswa`
              : myStatus
                ? `Masuk ${myStatus.checkInTime ?? "-"} · Pulang ${myStatus.checkOutTime ?? "-"}`
                : "Belum melakukan absen hari ini"}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl p-4 ring-1 ${card.cls} ${card.ring}`}>
              <Icon className="h-5 w-5 opacity-70" />
              <p className="mt-3 text-3xl font-bold tabular-nums">{mounted ? card.value : "…"}</p>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
            </div>
          );
        })}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Aksi Cepat</h2>
          <Link
            href="/notifikasi"
            className="relative inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Bell className="h-4 w-4" />
            Notifikasi
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-br p-5 shadow-lg transition-transform hover:-translate-y-0.5 ${action.cls}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-xs opacity-90">{action.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              {staff ? "Status Hari Ini" : "Absensi Kamu Hari Ini"}
            </h2>
            <span className="text-sm text-zinc-400">{totalDays} hari tersimpan</span>
          </div>
          {staff ? (
            <ul className="mt-4 space-y-2.5">
              {todayStudents.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-medium text-zinc-800">{s.name}</span>
                  </div>
                  {mounted ? getStatusBadge(s.status) : <span className="text-xs text-zinc-400">…</span>}
                </li>
              ))}
            </ul>
          ) : myStatus ? (
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <span className="text-sm text-zinc-600">Status</span>
                {mounted ? getStatusBadge(myStatus.status) : <span className="text-xs text-zinc-400">…</span>}
              </li>
              <li className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <span className="text-sm text-zinc-600">Jam Masuk</span>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">{myStatus.checkInTime ?? "-"}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
                <span className="text-sm text-zinc-600">Jam Pulang</span>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">{myStatus.checkOutTime ?? "-"}</span>
              </li>
            </ul>
          ) : (
            <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              {mounted ? "Belum ada absensi hari ini." : "Memuat…"}
            </p>
          )}
          <Link
            href="/absen"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Kelola absensi lengkap <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Statistik Kehadiran</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Total Hari</span>
              <span className="text-sm font-semibold text-zinc-900">{totalDays} hari</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Rata-rata Kehadiran</span>
              <span className="text-sm font-semibold text-emerald-600">{attendanceRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{stats.hadir ?? 0}</p>
                <p className="text-xs text-emerald-600">Total Hadir</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{stats.terlambat ?? 0}</p>
                <p className="text-xs text-amber-600">Total Terlambat</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.izin ?? 0}</p>
                <p className="text-xs text-blue-600">Total Izin</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">{stats.sakit ?? 0}</p>
                <p className="text-xs text-purple-600">Total Sakit</p>
              </div>
            </div>
          </div>
          <Link
            href="/statistik"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Lihat statistik lengkap <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}