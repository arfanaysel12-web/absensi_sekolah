"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, CheckCircle2, XCircle, AlertTriangle, FileText, Heart, Search, Filter } from "lucide-react";
import type { AttendanceStatus } from "@/lib/students";
import { formatDateLabel } from "@/lib/students";

interface HistoryRecord {
  id: number;
  studentId: number | null;
  studentName: string;
  userClassName?: string | null;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface HistoryEntry {
  date: string;
  records: HistoryRecord[];
}

type StatusFilter = "all" | "hadir" | "tidak_hadir" | "terlambat" | "izin" | "sakit" | "alpha";

export default function RiwayatPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/attendance/history", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEntries(data.entries);
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, []);

  const filteredEntries = entries.filter((entry) => {
    if (dateFilter && !entry.date.includes(dateFilter)) return false;
    if (statusFilter !== "all") {
      const hasStatus = entry.records.some((record) => record.status === statusFilter);
      if (!hasStatus) return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      const studentMatch = entry.records.some((r) => r.studentName.toLowerCase().includes(searchLower));
      if (!studentMatch) return false;
    }
    return true;
  });

  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "hadir":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Hadir
          </span>
        );
      case "tidak_hadir":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
            <XCircle className="h-3 w-3" /> Tidak
          </span>
        );
      case "terlambat":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3 w-3" /> Terlambat
          </span>
        );
      case "izin":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            <FileText className="h-3 w-3" /> Izin
          </span>
        );
      case "sakit":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
            <Heart className="h-3 w-3" /> Sakit
          </span>
        );
      case "alpha":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            <XCircle className="h-3 w-3" /> Alpha
          </span>
        );
      default:
        return <span className="text-xs text-zinc-400">-</span>;
    }
  };

  const getStatusCounts = (records: HistoryRecord[]) => {
    let hadir = 0, tidak = 0, terlambat = 0, izin = 0, sakit = 0, alpha = 0;
    records.forEach((record) => {
      switch (record.status) {
        case "hadir": hadir++; break;
        case "tidak_hadir": tidak++; break;
        case "terlambat": terlambat++; break;
        case "izin": izin++; break;
        case "sakit": sakit++; break;
        case "alpha": alpha++; break;
      }
    });
    return { hadir, tidak, terlambat, izin, sakit, alpha };
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Riwayat Absensi</h1>
        <p className="mt-1 text-sm text-zinc-500">Rekap kehadiran siswa pada setiap tanggal</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama siswa..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir">Tidak Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpha">Alpha</option>
            </select>
          </div>
        </div>
      </section>

      {!mounted ? (
        <p className="text-sm text-zinc-400">Memuat…</p>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <CalendarDays className="h-12 w-12 text-zinc-300" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-800">Tidak ada riwayat</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {search || dateFilter || statusFilter !== "all"
              ? "Tidak ada data yang cocok dengan filter pencarian."
              : "Belum ada data absensi yang tersimpan. Mulai lakukan absen hari ini."
            }
          </p>
          {(search || dateFilter || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setDateFilter("");
                setStatusFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <Filter className="h-4 w-4" />
              Reset Filter
            </button>
          )}
          {!search && !dateFilter && statusFilter === "all" && (
            <Link
              href="/absen"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ClipboardList className="h-4 w-4" />
              Mulai Absen
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedEntries.map((entry) => {
              const counts = getStatusCounts(entry.records);
              const isOpen = open === entry.date;
              return (
                <div key={entry.date} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : entry.date)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-800">{formatDateLabel(entry.date)}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
                        <span className="font-medium text-emerald-600">{counts.hadir} hadir</span>
                        {counts.terlambat > 0 && <span className="font-medium text-amber-600">{counts.terlambat} terlambat</span>}
                        {counts.izin > 0 && <span className="font-medium text-blue-600">{counts.izin} izin</span>}
                        {counts.sakit > 0 && <span className="font-medium text-purple-600">{counts.sakit} sakit</span>}
                        {counts.alpha > 0 && <span className="font-medium text-red-600">{counts.alpha} alpha</span>}
                        {counts.tidak > 0 && <span className="font-medium text-rose-600">{counts.tidak} tidak hadir</span>}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-100 px-5 py-4">
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {entry.records.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                                {r.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <span className="truncate text-sm font-medium text-zinc-700">{r.studentName}</span>
                                {r.checkInTime && <p className="text-xs text-zinc-500">Masuk {r.checkInTime}</p>}
                                {r.checkOutTime && <p className="text-xs text-zinc-400">Pulang {r.checkOutTime}</p>}
                              </div>
                            </div>
                            {getStatusBadge(r.status)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          <p className="text-center text-sm text-zinc-500">
            Menampilkan {paginatedEntries.length} dari {filteredEntries.length} riwayat
          </p>
        </>
      )}
    </div>
  );
}