"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, FileText, Heart, XCircle, Clock } from "lucide-react";
import { formatDateLabel, type AttendanceStatus } from "@/lib/students";

const STATUS_COLORS = {
  hadir: "bg-emerald-500",
  terlambat: "bg-amber-500",
  izin: "bg-blue-500",
  sakit: "bg-purple-500",
  alpha: "bg-red-500",
  tidak_hadir: "bg-rose-500",
} as const;

const STATUS_LABELS = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
  tidak_hadir: "Tidak Hadir",
} as const;

export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [historyByDate, setHistoryByDate] = useState<Record<string, Record<number, AttendanceStatus>>>({});

  useEffect(() => {
    fetch("/api/attendance/history", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const map: Record<string, Record<number, AttendanceStatus>> = {};
        for (const entry of data.entries) {
          map[entry.date] = {};
          for (const rec of entry.records) {
            if (rec.studentId) map[entry.date][rec.studentId] = rec.status;
          }
        }
        setHistoryByDate(map);
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, []);

  const computeCalendarData = (): Record<string, AttendanceStatus> => {
    const rangeKeys = Object.keys(historyByDate);
    const result: Record<string, AttendanceStatus> = {};
    for (const dateKey of rangeKeys) {
      const statuses = Object.values(historyByDate[dateKey]);
      if (!statuses.length) continue;
      const counts = new Map<AttendanceStatus, number>();
      for (const status of statuses) {
        if (status) counts.set(status, (counts.get(status) ?? 0) + 1);
      }
      let dominant: AttendanceStatus | null = null;
      let max = 0;
      for (const [status, count] of counts) {
        if (count > max) {
          dominant = status;
          max = count;
        }
      }
      if (dominant) result[dateKey] = dominant;
    }
    return result;
  };

  useEffect(() => {
    setCalendarData(computeCalendarData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyByDate, currentDate.getFullYear(), currentDate.getMonth()]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDay }, (_, i) => i);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateKey === selectedDate ? null : dateKey);
  };

  const getStatusForDay = (day: number): AttendanceStatus | null => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarData[dateKey] || null;
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "hadir": return <CheckCircle2 className="h-4 w-4" />;
      case "terlambat": return <AlertTriangle className="h-4 w-4" />;
      case "izin": return <FileText className="h-4 w-4" />;
      case "sakit": return <Heart className="h-4 w-4" />;
      case "alpha": return <XCircle className="h-4 w-4" />;
      case "tidak_hadir": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const today = new Date();
  const isToday = (day: number) => 
    day === today.getDate() && 
    month === today.getMonth() && 
    year === today.getFullYear();

  if (!mounted) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Kalender Kehadiran</h1>
          <p className="mt-1 text-sm text-zinc-500">Memuat kalender…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Kalender Kehadiran</h1>
        <p className="mt-1 text-sm text-zinc-500">Lihat kehadiran bulanan dalam bentuk kalender</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-900">
              {monthNames[month]} {year}
            </h2>
          </div>

          <button
            onClick={goToNextMonth}
            className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          Hari Ini
        </button>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const status = getStatusForDay(day);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`relative aspect-square rounded-lg border transition-all hover:scale-105 ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : isCurrentDay
                      ? "border-indigo-300"
                      : "border-zinc-200"
                } ${status ? STATUS_COLORS[status] : "bg-white"} ${
                  !status && isCurrentDay ? "bg-indigo-50" : ""
                }`}
                title={status ? STATUS_LABELS[status] : "Tidak ada data"}
              >
                <span className={`text-sm font-medium ${status ? "text-white" : isCurrentDay ? "text-indigo-700" : "text-zinc-700"}`}>
                  {day}
                </span>
                {status && (
                  <div className="absolute bottom-1 right-1 text-white">
                    {getStatusIcon(status)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-600">Hadir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-600">Terlambat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-600">Izin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-xs text-zinc-600">Sakit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-600">Alpha</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-xs text-zinc-600">Tidak Hadir</span>
          </div>
        </div>
      </section>

      {selectedDate && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">
            Detail: {formatDateLabel(selectedDate)}
          </h3>
          <div className="flex items-center gap-3">
            {getStatusForDay(parseInt(selectedDate.split("-")[2])) ? (
              <>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  STATUS_COLORS[getStatusForDay(parseInt(selectedDate.split("-")[2]))!]
                }`}>
                  {getStatusIcon(getStatusForDay(parseInt(selectedDate.split("-")[2]))!)}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">
                    {STATUS_LABELS[getStatusForDay(parseInt(selectedDate.split("-")[2]))!]}
                  </p>
                  <p className="text-sm text-zinc-500">Status kehadiran pada tanggal ini</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Tidak Ada Data</p>
                  <p className="text-sm text-zinc-500">Belum ada data absensi pada tanggal ini</p>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}