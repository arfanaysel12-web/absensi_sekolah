"use client";

import { useEffect, useState } from "react";
import { UserPlus, Pencil, Trash2, X, Check, Users } from "lucide-react";
import type { Student } from "@/lib/students";

export default function SiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/students", { cache: "no-store" });
    const data = await res.json();
    if (data.success) setStudents(data.students);
  };

  useEffect(() => {
    load().catch(() => {});
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, class: "XI RPL 1" }),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Siswa ditambahkan" : "Gagal menambah siswa"));
      if (data.success) {
        setNewName("");
        load().catch(() => {});
      }
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleStartEdit = (s: Student) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Siswa diperbarui" : "Gagal memperbarui"));
      if (data.success) {
        setEditingId(null);
        setEditName("");
        load().catch(() => {});
      }
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus siswa ini dari daftar?")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await res.json();
      setToast(data.message || (data.success ? "Siswa dihapus" : "Gagal menghapus"));
      if (data.success) load().catch(() => {});
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Kelola Siswa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mounted ? `${students.length}` : "…"} siswa tercatat di kelas XI RPL 1
        </p>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1">
          <UserPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama siswa baru…"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Tambah
        </button>
      </form>

      {!mounted ? (
        <p className="text-sm text-zinc-400">Memuat…</p>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Users className="h-12 w-12 text-zinc-300" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-800">Belum ada siswa</h2>
          <p className="mt-1 text-sm text-zinc-500">Tambahkan siswa untuk mulai absensi.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {students.map((student) => {
            const isEditing = editingId === student.id;
            return (
              <li key={student.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                {isEditing ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none ring-indigo-500 focus:ring-2"
                    />
                    <div className="flex gap-2 sm:flex-none sm:flex-col">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(student.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" /> Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
                      >
                        <X className="h-4 w-4" /> Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {student.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-800">{student.name}</p>
                        <p className="text-xs text-zinc-400">No. {student.id}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(student)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(student.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl lg:bottom-24"
        >
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}