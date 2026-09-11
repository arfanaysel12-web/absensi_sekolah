"use client";

import { useEffect, useState } from "react";
import { FileText, Heart, Plus, CheckCircle2, XCircle, Clock, Check, Upload, X } from "lucide-react";
import { formatDateLabel, CLASS_OPTIONS } from "@/lib/students";
import { fetchWithTimeout } from "@/lib/fetch";

interface LeaveItem {
  id: number;
  studentId: number | null;
  studentName: string;
  type: "izin" | "sakit";
  startDate: string;
  endDate: string;
  reason: string;
  evidence?: string | null;
  status: "pending" | "approved" | "rejected";
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  reviewedByName: string | null;
}

export default function PengajuanIzinPage() {
  const [requests, setRequests] = useState<LeaveItem[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; kelas: string }[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    type: "izin" as "izin" | "sakit",
    startDate: "",
    endDate: "",
    reason: "",
    evidence: "",
    kelas: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const isStaff = role === "admin" || role === "guru";

  const load = async () => {
    const res = await fetchWithTimeout("/api/leave-requests", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setRequests(data.requests);
  };

  useEffect(() => {
    setMounted(true);
    fetchWithTimeout("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setRole(d?.user?.role ?? "siswa");
        // Load students if user is staff
        if (d?.user?.role === "admin" || d?.user?.role === "guru") {
          fetchWithTimeout("/api/students", { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setStudents(data.students.map((s: any) => ({ id: s.id, name: s.name, kelas: s.class })));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setToast("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    if (formData.startDate > formData.endDate) {
      setToast("Tanggal selesai tidak boleh sebelum tanggal mulai");
      return;
    }
    if (isStaff && !formData.studentId) {
      setToast("Mohon pilih siswa");
      return;
    }

    try {
      const body: Record<string, unknown> = {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        evidence: formData.evidence || undefined,
        studentId: isStaff && formData.studentId ? Number(formData.studentId) : undefined,
        kelas: formData.kelas || undefined,
      };

      const res = await fetchWithTimeout("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setToast(data.message || "Gagal mengirim pengajuan");
        return;
      }

      setFormData({ studentId: "", type: "izin", startDate: "", endDate: "", reason: "", evidence: "", kelas: "" });
      setUploadedFileName(null);
      setShowForm(false);
      setToast("Pengajuan berhasil dikirim");
      load().catch(() => {});
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus pengajuan ini?")) return;
    try {
      const res = await fetchWithTimeout(`/api/leave-requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      setToast(data.message || (data.success ? "Pengajuan dihapus" : "Gagal menghapus"));
      if (data.success) load().catch(() => {});
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleReview = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetchWithTimeout(`/api/leave-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Pengajuan diproses" : "Gagal memproses"));
      if (data.success) load().catch(() => {});
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setToast("Tipe file tidak didukung. Hanya JPG, JPEG, PNG, PDF, DOC, dan DOCX yang diperbolehkan");
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setToast("Ukuran file terlalu besar. Maksimal 20MB");
      return;
    }

    setUploading(true);
    try {
      const fileFormData = new FormData();
      fileFormData.append('file', file);

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 60000);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fileFormData,
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const data = await res.json();

      if (data.success) {
        setFormData((prev) => ({ ...prev, evidence: data.url }));
        setUploadedFileName(file.name);
        setToast("File berhasil diupload");
      } else {
        setToast(data.message || "Gagal mengupload file");
      }
    } catch {
      setToast("Terjadi kesalahan saat mengupload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, evidence: "" });
    setUploadedFileName(null);
  };

  const getStatusBadge = (status: LeaveItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Clock className="h-3 w-3" />
            Menunggu
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <XCircle className="h-3 w-3" />
            Ditolak
          </span>
        );
    }
  };

  const getTypeIcon = (type: "izin" | "sakit") => {
    return type === "izin" ? <FileText className="h-4 w-4" /> : <Heart className="h-4 w-4" />;
  };

  const getTypeLabel = (type: "izin" | "sakit") => {
    return type === "izin" ? "Izin" : "Sakit";
  };

  const getTypeColor = (type: "izin" | "sakit") => {
    return type === "izin" ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50";
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Pengajuan Izin</h1>
        <p className="mt-1 text-sm text-zinc-500">Ajukan izin atau sakit untuk siswa</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <Clock className="h-4 w-4 text-amber-500" />
            Menunggu
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">
            {requests.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Disetujui
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">
            {requests.filter((r) => r.status === "approved").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <XCircle className="h-4 w-4 text-rose-500" />
            Ditolak
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900 tabular-nums">
            {requests.filter((r) => r.status === "rejected").length}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Riwayat Pengajuan</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Tutup Form" : "Buat Pengajuan"}
        </button>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Form Pengajuan Izin/Sakit</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {isStaff && students.length > 0 && formData.kelas && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Siswa</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value, kelas: e.target.options[e.target.options.selectedIndex].getAttribute('data-kelas') || "" })}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                    required
                  >
                    <option value="">Pilih siswa</option>
                    {students.map((student) => {
                      if (student.kelas !== formData.kelas) return null;
                      return (
                        <option key={student.id} value={student.id} data-kelas={student.kelas}>
                          {student.name} ({student.kelas})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              {isStaff && students.length > 0 && !formData.kelas && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Siswa</label>
                  <select disabled>
                    <option value="">-- Pilih kelas terlebih dahulu --</option>
                  </select>
                </div>
              )}
              {isStaff && students.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Siswa</label>
                  <p className="text-sm text-zinc-500 py-2.5">Memuat data siswa...</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Jenis Pengajuan</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "izin" | "sakit" })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                  required
                >
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Kelas</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value, studentId: "" })}
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alasan</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                placeholder="Jelaskan alasan pengajuan..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bukti (Opsional)</label>
              {formData.evidence ? (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="flex-1 text-sm font-medium text-emerald-700 truncate">
                    {uploadedFileName || "File terupload"}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="evidence-file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="evidence-file"
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed ${
                      uploading
                        ? "border-zinc-300 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                        : "border-zinc-300 bg-white text-zinc-600 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
                    } px-4 py-3 text-sm font-medium transition-colors`}
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Pilih File (JPG, JPEG, PNG, PDF, DOC, DOCX - Max 20MB)
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Kirim Pengajuan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {!mounted ? (
        <p className="text-sm text-zinc-400">Memuat…</p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <FileText className="h-12 w-12 text-zinc-300" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-800">Belum ada pengajuan</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Belum ada pengajuan izin atau sakit. Buat pengajuan baru untuk memulai.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${getTypeColor(request.type)}`}>
                    {getTypeIcon(request.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900">{request.studentName}</p>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {getTypeLabel(request.type)} &middot; {formatDateLabel(request.startDate)}
                      {request.startDate !== request.endDate && ` - ${formatDateLabel(request.endDate)}`}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 line-clamp-2">{request.reason}</p>
                    {request.evidence && (
                      <p className="mt-1 text-xs text-zinc-500">
                        <span className="font-medium">Bukti:</span>{" "}
                        {request.evidence.startsWith('/uploads/') ? (
                          <a
                            href={request.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 underline"
                          >
                            Lihat File
                          </a>
                        ) : (
                          <a
                            href={request.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 underline"
                          >
                            {request.evidence}
                          </a>
                        )}
                      </p>
                    )}
                    {request.status !== "pending" && request.reviewNotes && (
                      <p className="mt-1 text-xs text-zinc-500">
                        <span className="font-medium">Catatan:</span> {request.reviewNotes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-zinc-400">
                      Diajukan: {request.submittedAt ? new Date(request.submittedAt).toLocaleString("id-ID") : "…"}
                      {request.reviewedByName && ` · Diproses oleh ${request.reviewedByName}`}
                    </p>
                  </div>
                </div>

                {(request.status === "pending" && isStaff) && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReview(request.id, "approve")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview(request.id, "reject")}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </button>
                  </div>
                )}

                {request.status === "pending" && !isStaff && (
                  <button
                    onClick={() => handleDelete(request.id)}
                    className="shrink-0 rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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