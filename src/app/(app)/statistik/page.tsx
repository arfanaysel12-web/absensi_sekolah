"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Medal, BarChart3 } from "lucide-react";
import type { AttendanceStatus, Student, AttendanceRecord } from "@/lib/students";
import { formatDateLabel } from "@/lib/students";
import { fetchWithTimeout } from "@/lib/fetch";

interface TrendPoint {
  label: string;
  hadir: number;
  tidak: number;
}

type StoredRecord = AttendanceRecord | AttendanceStatus;

export default function StatistikPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<Record<string, Record<string, StoredRecord>>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchWithTimeout("/api/students", { cache: "no-store" }),
      fetchWithTimeout("/api/attendance/history", { cache: "no-store" }),
    ])
      .then(async ([studentsRes, historyRes]) => {
        const studentsData = await studentsRes.json();
        if (studentsData.success) setStudents(studentsData.students);

        const historyData = await historyRes.json();
        if (historyData.success) {
          const map: Record<string, Record<string, StoredRecord>> = {};
          for (const entry of historyData.entries) {
            map[entry.date] = {};
            for (const rec of entry.records) {
              if (rec.studentId) map[entry.date][String(rec.studentId)] = rec.status;
            }
          }
          setHistory(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const trend = useMemo<TrendPoint[]>(() => {
    return Object.keys(history)
      .sort()
      .map((date) => {
        const rec = history[date];
        let hadir = 0;
        let tidak = 0;
        for (const s of students) {
          const record = rec[s.id];
          const status = record !== null && typeof record === 'object' ? record.status : record as AttendanceStatus;
          if (status === "hadir") hadir++;
          else if (status === "tidak_hadir") tidak++;
        }
        return {
          label: new Date(date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          hadir,
          tidak,
        };
      });
  }, [history, students]);

  const perStudent = useMemo(() => {
    const dates = Object.keys(history);
    const totalDays = dates.length || 1;
    return students
      .map((s) => {
        let hadir = 0;
        for (const d of dates) {
          const record = history[d][s.id];
          const status = record !== null && typeof record === 'object' ? record.status : record as AttendanceStatus;
          if (status === "hadir") hadir++;
        }
        const pct = Math.round((hadir / totalDays) * 100);
        return { id: s.id, name: s.name, hadir, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [history, students]);

  const top = perStudent[0];
  const bottom = perStudent[perStudent.length - 1];
  const avgPct = perStudent.length
    ? Math.round(perStudent.reduce((a, s) => a + s.pct, 0) / perStudent.length)
    : 0;

  const chartColors = ["#4f46e5", "#059669", "#e11d48", "#7c3aed", "#f59e0b", "#0ea5e9", "#db2777", "#65a30d"];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Statistik Kehadiran</h1>
        <p className="mt-1 text-sm text-zinc-500">Analisis kehadiran siswa kelas XI RPL 1</p>
      </header>

      {!loaded ? (
        <p className="text-sm text-zinc-400">Memuat…</p>
      ) : (
        <>
          {Object.keys(history).length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-zinc-300" />
              <h2 className="mt-4 text-lg font-semibold text-zinc-800">Belum ada data</h2>
              <p className="mt-1 text-sm text-zinc-500">Simpan absen minimal satu hari untuk melihat statistik.</p>
            </div>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Kehadiran rata-rata
                  </div>
                  <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">{avgPct}%</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                    <Medal className="h-4 w-4 text-amber-500" />
                    Siswa paling rajin
                  </div>
                  <p className="mt-2 truncate text-lg font-bold text-zinc-900">{top ? top.name : "-"}</p>
                  <p className="text-sm text-zinc-500">{top ? `${top.pct}% kehadiran` : ""}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                    Perlu perhatian
                  </div>
                  <p className="mt-2 truncate text-lg font-bold text-zinc-900">{bottom ? bottom.name : "-"}</p>
                  <p className="text-sm text-zinc-500">{bottom ? `${bottom.pct}% kehadiran` : ""}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-zinc-900">Tren Kehadiran per Hari</h2>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#a1a1aa" width={30} />
                      <Tooltip />
                      <Line type="monotone" dataKey="hadir" name="Hadir" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="tidak" name="Tidak Hadir" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-zinc-900">Persentase Kehadiran per Siswa</h2>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perStudent} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11 }}
                        stroke="#a1a1aa"
                      />
                      <Tooltip formatter={(v) => [`${v}%`, "Kehadiran"]} />
                      <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                        {perStudent.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <p className="text-center text-xs text-zinc-400">
                Statistik dihitung dari {Object.keys(history).length} hari terakhir yang tersimpan · {formatDateLabel(Object.keys(history).sort()[0])}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
