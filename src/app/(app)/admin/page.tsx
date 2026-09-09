"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Shield,
  TrendingUp,
  Activity,
} from "lucide-react";
import { formatDateLabel, todayKey } from "@/lib/students";

interface LeaveItem {
  id: number;
  studentName: string;
  type: "izin" | "sakit";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string | null;
  reviewedByName?: string | null;
}

interface TodayRow {
  id: string;
  name: string;
  status: string | null;
}

export default function AdminPage() {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [todayRows, setTodayRows] = useState<TodayRow[]>([]);
  const [todayStatus, setTodayStatus] = useState({ hadir: 0, tidak: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, belum: 0 });
  const [leaveRequests, setLeaveRequests] = useState<LeaveItem[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, attendanceRate: 0 });
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "students" | "monitoring" | "leave" | "stats">("dashboard");

  const loadLeave = async () => {
    const res = await fetch("/api/leave-requests", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setLeaveRequests(data.requests);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/students", { cache: "no-store" }),
      fetch("/api/attendance/today", { cache: "no-store" }),
      fetch("/api/attendance/stats", { cache: "no-store" }),
      fetch("/api/leave-requests", { cache: "no-store" }),
    ])
      .then(async ([studentsRes, todayRes, statsRes, leaveRes]) => {
        const studentsData = await studentsRes.json();
        const todayData = await todayRes.json();
        const statsData = await statsRes.json();
        const leaveData = await leaveRes.json();

        if (studentsData.success) {
          setStudents(studentsData.students.map((s: any) => ({ id: s.id, name: s.name })));
        }
        if (todayData.success) {
          const recordByStudent = new Map<number, any>();
          for (const rec of todayData.attendanceList || []) {
            if (rec.student_id) recordByStudent.set(rec.student_id, rec);
          }
          const rows: TodayRow[] = (todayData.students || []).map((s: any) => ({
            id: String(s.id),
            name: s.name,
            status: recordByStudent.get(Number(s.id))?.status ?? null,
          }));
          setTodayRows(rows);
          const counts = { hadir: 0, tidak: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, belum: 0 };
          rows.forEach((r) => {
            switch (r.status) {
              case "hadir": counts.hadir++; break;
              case "tidak_hadir": counts.tidak++; break;
              case "terlambat": counts.terlambat++; break;
              case "izin": counts.izin++; break;
              case "sakit": counts.sakit++; break;
              case "alpha": counts.alpha++; break;
              default: counts.belum++; break;
            }
          });
          setTodayStatus(counts);
        }
        if (statsData.success) setAttendanceStats(statsData.stats);
        if (leaveData.success) setLeaveRequests(leaveData.requests);
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, []);

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "students" as const, label: "Data Siswa", icon: Users },
    { id: "monitoring" as const, label: "Monitoring", icon: Activity },
    { id: "leave" as const, label: "Pengajuan Izin", icon: FileText },
    { id: "stats" as const, label: "Statistik", icon: BarChart3 },
  ];

  const handleLeaveRequest = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) loadLeave().catch(() => {});
    } catch {
      // abaikan
    }
  };

  if (!mounted) {
    return <p className="text-sm text-zinc-400">Memuat…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">Kelola sistem absensi sekolah</p>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-auto gap-2 border-b border-zinc-200 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Users className="h-4 w-4 text-indigo-500" />
                Total Siswa
              </div>
              <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">{students.length}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Hadir Hari Ini
              </div>
              <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">{todayStatus.hadir}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <FileText className="h-4 w-4 text-amber-500" />
                Pengajuan Pending
              </div>
              <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">
                {leaveRequests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Kehadiran Rate
              </div>
              <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">{attendanceStats.attendanceRate}%</p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Status Hari Ini</h3>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{todayStatus.hadir}</p>
                <p className="text-xs text-emerald-600">Hadir</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{todayStatus.terlambat}</p>
                <p className="text-xs text-amber-600">Terlambat</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{todayStatus.izin}</p>
                <p className="text-xs text-blue-600">Izin</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{todayStatus.sakit}</p>
                <p className="text-xs text-purple-600">Sakit</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{todayStatus.alpha}</p>
                <p className="text-xs text-red-600">Alpha</p>
              </div>
              <div className="rounded-xl bg-zinc-100 p-4 text-center">
                <p className="text-2xl font-bold text-zinc-700">{todayStatus.belum}</p>
                <p className="text-xs text-zinc-600">Belum</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Statistik Overview</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-900">{attendanceStats.hadir}</p>
                  <p className="text-sm text-emerald-700">Total Hadir</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-900">{attendanceStats.terlambat}</p>
                  <p className="text-sm text-amber-700">Total Terlambat</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{attendanceStats.izin}</p>
                  <p className="text-sm text-blue-700">Total Izin</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "students" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">Data Siswa</h3>
            <span className="text-sm text-zinc-500">{students.length} siswa</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const row = todayRows.find((r) => r.id === student.id);
                  const status = row?.status ?? null;
                  return (
                    <tr key={student.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3 text-sm text-zinc-600">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600">{student.id}</td>
                      <td className="px-4 py-3">
                        {status === "hadir" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Hadir
                          </span>
                        ) : status === "terlambat" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" /> Terlambat
                          </span>
                        ) : status === "izin" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            <FileText className="h-3 w-3" /> Izin
                          </span>
                        ) : status === "sakit" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            <FileText className="h-3 w-3" /> Sakit
                          </span>
                        ) : status === "alpha" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <XCircle className="h-3 w-3" /> Alpha
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">Belum absen</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "monitoring" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">Monitoring Real-time</h3>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700">Tanggal</p>
                  <p className="text-lg font-bold text-zinc-900">{formatDateLabel(todayKey())}</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-500" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-emerald-700">Siswa Hadir</p>
                    <p className="text-2xl font-bold text-emerald-900">{todayStatus.hadir}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <div>
                    <p className="text-sm text-rose-700">Siswa Tidak Hadir</p>
                    <p className="text-2xl font-bold text-rose-900">{todayStatus.tidak}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-700 mb-3">Log Aktivitas Terkini</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>System monitoring aktif</span>
                  <span className="ml-auto text-xs text-zinc-400">Sekarang</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Data absensi dimuat</span>
                  <span className="ml-auto text-xs text-zinc-400">1 menit lalu</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "leave" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">Kelola Pengajuan Izin</h3>
            <span className="text-sm text-zinc-500">
              {leaveRequests.filter((r) => r.status === "pending").length} pending
            </span>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">Belum ada pengajuan izin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-zinc-900">{request.studentName}</p>
                        {request.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Menunggu
                          </span>
                        )}
                        {request.status === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Disetujui
                          </span>
                        )}
                        {request.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            <XCircle className="h-3 w-3" />
                            Ditolak
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {request.type === "izin" ? "Izin" : "Sakit"} &middot; {formatDateLabel(request.startDate)}
                        {request.startDate !== request.endDate && ` - ${formatDateLabel(request.endDate)}`}
                      </p>
                      <p className="mt-1 text-sm text-zinc-700">{request.reason}</p>
                      {request.reviewedByName && (
                        <p className="mt-1 text-xs text-zinc-400">Diproses oleh {request.reviewedByName}</p>
                      )}
                    </div>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLeaveRequest(request.id, "approve")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleLeaveRequest(request.id, "reject")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "stats" && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Statistik Lengkap</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Total Hadir</p>
              <p className="text-3xl font-bold text-emerald-900">{attendanceStats.hadir}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Total Terlambat</p>
              <p className="text-3xl font-bold text-amber-900">{attendanceStats.terlambat}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Total Izin</p>
              <p className="text-3xl font-bold text-blue-900">{attendanceStats.izin}</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm text-purple-700">Total Sakit</p>
              <p className="text-3xl font-bold text-purple-900">{attendanceStats.sakit}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-red-700">Total Alpha</p>
              <p className="text-3xl font-bold text-red-900">{attendanceStats.alpha}</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-sm text-indigo-700">Kehadiran Rate</p>
              <p className="text-3xl font-bold text-indigo-900">{attendanceStats.attendanceRate}%</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}