"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCheck, CheckCircle2, MapPin, RotateCcw, Save, Search, LogIn, LogOut } from "lucide-react";
import type { AttendanceStatus, StudentWithStatus } from "@/lib/students";
import StudentRow from "@/components/student-row";
import Summary from "@/components/summary";
import { CLASS_OPTIONS } from "@/lib/students";
import { fetchWithTimeout } from "@/lib/fetch";

type Filter = "semua" | "hadir" | "tidak_hadir" | "terlambat" | "izin" | "sakit" | "alpha" | "belum";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "hadir", label: "Hadir" },
  { key: "tidak_hadir", label: "Tidak Hadir" },
  { key: "terlambat", label: "Terlambat" },
  { key: "izin", label: "Izin" },
  { key: "sakit", label: "Sakit" },
  { key: "alpha", label: "Alpha" },
  { key: "belum", label: "Belum" },
];

interface StudentRowData {
  id: string;
  name: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  kelas?: string;
}

export default function AbsenPage() {
  const [role, setRole] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRowData[]>([]);
  const [selfRecord, setSelfRecord] = useState<{
    status: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [classFilter, setClassFilter] = useState<string>("");
  const [showFullOptions, setShowFullOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const isStaff = role === "admin" || role === "guru";

  useEffect(() => {
    Promise.all([
      fetchWithTimeout("/api/attendance/today", { cache: "no-store" }),
      fetchWithTimeout("/api/auth/me", { cache: "no-store" }),
    ])
      .then(async ([todayRes, meRes]) => {
        const today = await todayRes.json();
        const me = await meRes.json();
        setRole(me?.user?.role ?? null);

        if (today?.success) {
          if (today.attendanceList && today.students) {
            const recordByStudent = new Map<number, any>();
            for (const rec of today.attendanceList) {
              if (rec.student_id) recordByStudent.set(rec.student_id, rec);
            }
            setStudents(
              today.students.map((s: any) => {
                const rec = recordByStudent.get(Number(s.id));
                return {
                  id: String(s.id),
                  name: s.name,
                  status: rec ? rec.status : null,
                  checkInTime: rec ? rec.check_in_time : null,
                  checkOutTime: rec ? rec.check_out_time : null,
                  kelas: s.class,
                };
              })
            );
          } else if (today.attendance) {
            setSelfRecord({
              status: today.attendance.status,
              checkInTime: today.attendance.checkInTime,
              checkOutTime: today.attendance.checkOutTime,
            });
          }
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleChange = (id: string, status: Exclude<AttendanceStatus, null>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const togglingOff = s.status === status;
        return {
          ...s,
          status: togglingOff ? null : status,
        };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Proses per-batch (maks 5 paralel) agar tidak membebani koneksi DB
      const batchSize = 5;
      const batches: StudentRowData[][] = [];
      for (let i = 0; i < students.length; i += batchSize) {
        batches.push(students.slice(i, i + batchSize));
      }
      for (const batch of batches) {
        await Promise.all(
          batch.map((s) =>
            fetchWithTimeout("/api/attendance/mark", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId: Number(s.id), status: s.status }),
            })
          )
        );
      }
      setToast(`Absensi disimpan pukul ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
    } catch {
      setToast("Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Yakin ingin mengosongkan semua status hari ini?")) return;
    setStudents((prev) => prev.map((s) => ({ ...s, status: null })));
    setToast("Semua status dikosongkan. Tekan Simpan untuk menyimpan.");
  };

  const handleMarkAll = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status ?? "hadir",
      }))
    );
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLocationEnabled(true);
          setToast("Lokasi berhasil didapatkan");
        },
        () => setToast("Gagal mendapatkan lokasi")
      );
    } else {
      setToast("Geolocation tidak didukung browser ini");
    }
  };

  const doCheckIn = async () => {
    try {
      const res = await fetchWithTimeout("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : {}),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Absen masuk berhasil" : "Gagal"));
      if (data.success) {
        setSelfRecord({
          status: data.attendance?.status ?? null,
          checkInTime: data.attendance?.checkInTime ?? null,
          checkOutTime: data.attendance?.checkOutTime ?? null,
        });
      }
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const doCheckOut = async () => {
    try {
      const res = await fetchWithTimeout("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Absen pulang berhasil" : "Gagal"));
      if (data.success && selfRecord) {
        setSelfRecord({ ...selfRecord, checkOutTime: data.checkOutTime ?? selfRecord.checkOutTime });
      }
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const combined: StudentWithStatus[] = useMemo(
    () => students.map((s) => ({ id: s.id, name: s.name, status: s.status })),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combined.filter((s) => {
      if (classFilter && s.kelas !== classFilter) return false;
      if (filter === "hadir" && s.status !== "hadir") return false;
      if (filter === "tidak_hadir" && s.status !== "tidak_hadir") return false;
      if (filter === "terlambat" && s.status !== "terlambat") return false;
      if (filter === "izin" && s.status !== "izin") return false;
      if (filter === "sakit" && s.status !== "sakit") return false;
      if (filter === "alpha" && s.status !== "alpha") return false;
      if (filter === "belum" && s.status !== null) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [combined, filter, search, classFilter]);

  const hadir = combined.filter((s) => s.status === "hadir").length;
  const terlambat = combined.filter((s) => s.status === "terlambat").length;
  const izin = combined.filter((s) => s.status === "izin").length;
  const sakit = combined.filter((s) => s.status === "sakit").length;
  const alpha = combined.filter((s) => s.status === "alpha").length;
  const tidakHadir = combined.filter((s) => s.status === "tidak_hadir").length;
  const belum = combined.filter((s) => s.status === null).length;

  const todayLabel = isLoaded
    ? new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "…";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Absen Harian</h1>
        <p className="mt-1 text-sm text-zinc-500">Kelas {classFilter || "Semua Kelas"} &middot; {todayLabel}</p>
      </header>

      {!isStaff && (
        <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-600/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-indigo-100">Absensi kamu hari ini</p>
              <p className="mt-1 text-xl font-bold">
                {selfRecord
                  ? `Masuk ${selfRecord.checkInTime ?? "-"} · Pulang ${selfRecord.checkOutTime ?? "-"}`
                  : "Belum ada absensi hari ini"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={doCheckIn}
                disabled={!!selfRecord?.checkInTime && !selfRecord?.checkOutTime}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 shadow disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Absen Masuk
              </button>
              <button
                type="button"
                onClick={doCheckOut}
                disabled={!selfRecord?.checkInTime || !!selfRecord?.checkOutTime}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 shadow disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Absen Pulang
              </button>
            </div>
          </div>
        </section>
      )}

      <Summary
        hadir={hadir}
        tidakHadir={tidakHadir}
        terlambat={terlambat}
        izin={izin}
        sakit={sakit}
        alpha={alpha}
        belumAbsen={belum}
        total={combined.length}
        showFullStats={showFullOptions}
      />

      {isStaff && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa…"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              />
            </div>
            <div className="relative flex-1 sm:ml-4">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              >
                <option value="">Semua Kelas</option>
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFullOptions(!showFullOptions)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  showFullOptions
                    ? "bg-indigo-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Opsi Lengkap
              </button>
              <button
                type="button"
                onClick={handleGetLocation}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  locationEnabled
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <MapPin className="h-4 w-4" />
                {locationEnabled ? "Lokasi Aktif" : "Aktifkan Lokasi"}
              </button>
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <CheckCheck className="h-4 w-4" />
                Tandai Semua Hadir
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count =
                f.key === "semua"
                  ? combined.length
                  : f.key === "hadir"
                    ? hadir
                    : f.key === "tidak_hadir"
                      ? tidakHadir
                      : f.key === "terlambat"
                        ? terlambat
                        : f.key === "izin"
                          ? izin
                          : f.key === "sakit"
                            ? sakit
                            : f.key === "alpha"
                              ? alpha
                              : belum;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {f.label} <span className={active ? "text-indigo-200" : "text-zinc-400"}>({count})</span>
                </button>
              );
            })}
          </div>

          <section aria-label="Daftar siswa">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Daftar Siswa</h2>
              <span className="text-sm text-zinc-400">{isLoaded ? filtered.length : "…"} siswa</span>
            </div>
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
                Tidak ada siswa yang cocok dengan pencarian/filter.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {filtered.map((student) => (
                  <StudentRow
                    key={student.id}
                    id={student.id}
                    name={student.name}
                    status={student.status}
                    onChange={handleChange}
                    showFullOptions={showFullOptions}
                  />
                ))}
              </ul>
            )}
          </section>

          <div className="sticky bottom-20 mt-8 flex flex-col gap-2 sm:bottom-6 sm:flex-row lg:bottom-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saving ? "Menyimpan…" : "Simpan Absensi"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl lg:bottom-24"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}