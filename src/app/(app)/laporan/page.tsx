"use client";

import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Download, CalendarDays } from "lucide-react";
import type { AttendanceStatus, Student } from "@/lib/students";
import { formatDateLabel, todayKey } from "@/lib/students";

interface HistoryRecord {
  id: number;
  studentId: number | null;
  studentName: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export default function LaporanPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [recordsByDate, setRecordsByDate] = useState<Record<string, Record<number, AttendanceStatus>>>({});
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/students", { cache: "no-store" }),
      fetch("/api/attendance/history", { cache: "no-store" }),
    ])
      .then(async ([studentsRes, historyRes]) => {
        const studentsData = await studentsRes.json();
        if (studentsData.success) setStudents(studentsData.students);

        const historyData = await historyRes.json();
        if (historyData.success) {
          const map: Record<string, Record<number, AttendanceStatus>> = {};
          for (const entry of historyData.entries) {
            map[entry.date] = {};
            for (const rec of entry.records as HistoryRecord[]) {
              if (rec.studentId) map[entry.date][rec.studentId] = rec.status;
            }
          }
          setRecordsByDate(map);
        }
      })
      .catch(() => { setMounted(true); })
      .finally(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (mounted && !selectedDate) setSelectedDate(todayKey());
  }, [mounted, selectedDate]);

  const records = selectedDate ? recordsByDate[selectedDate] ?? {} : {};

  const getStatus = (studentId: string): AttendanceStatus => {
    return records[Number(studentId)] ?? null;
  };

  const hadir = students.filter((s) => getStatus(s.id) === "hadir").length;
  const tidak = students.filter((s) => getStatus(s.id) === "tidak_hadir").length;

  const buildRows = (): string[][] => {
    return students.map((s, i) => {
      const status = getStatus(s.id);
      return [
        String(i + 1),
        s.name,
        status === "hadir" ? "Hadir" : status === "tidak_hadir" ? "Tidak Hadir" : status === "terlambat" ? "Terlambat" : status === "izin" ? "Izin" : status === "sakit" ? "Sakit" : status === "alpha" ? "Alpha" : "-",
      ];
    });
  };

  const exportCSV = () => {
    const rows = [
      ["No", "Nama", "Status"],
      ...buildRows(),
      [],
      ["Tanggal", formatDateLabel(selectedDate)],
      ["Guru", "Wali Kelas XI RPL 1"],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Absensi Siswa", 14, 20);
    doc.setFontSize(11);
    doc.text(`Kelas XI RPL 1`, 14, 28);
    doc.text(`Tanggal: ${formatDateLabel(selectedDate)}`, 14, 35);
    doc.text(`Guru: Wali Kelas`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [["No", "Nama Siswa", "Status"]],
      body: buildRows(),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.text(`Ringkasan: ${hadir} hadir, ${tidak} tidak hadir, dari ${students.length} siswa.`, 14, finalY);

    doc.save(`absensi-${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Laporan <span className="hidden sm:inline">&amp; Export</span></h1>
        <p className="mt-1 text-sm text-zinc-500">Unduh laporan absensi dalam format PDF atau Excel/CSV</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          Pilih tanggal
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 focus:ring-2 sm:w-64"
        />
        {selectedDate && (
          <p className="mt-3 text-sm text-zinc-500">
            <span className="font-semibold text-zinc-800">{hadir}</span> hadir ·{" "}
            <span className="font-semibold text-zinc-800">{tidak}</span> tidak hadir · total{" "}
            {students.length} siswa
          </p>
        )}
      </section>

      {mounted && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={exportPDF}
            className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 p-5 text-left text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Unduh PDF</p>
              <p className="text-xs opacity-90">Laporan rapi siap cetak</p>
            </div>
            <Download className="h-5 w-5 opacity-80" />
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-left text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Unduh Excel / CSV</p>
              <p className="text-xs opacity-90">Kompatibel Microsoft Excel</p>
            </div>
            <Download className="h-5 w-5 opacity-80" />
          </button>
        </div>
      )}
    </div>
  );
}