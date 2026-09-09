"use client";

import { useEffect, useState } from "react";
import { User, Mail, GraduationCap, MapPin, Shield, LogOut, Camera, Edit, Save, X, Lock } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  email: string;
  role: "admin" | "guru" | "siswa";
  className: string | null;
  nis: string | null;
  photo: string | null;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    className: "",
    nis: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile(data.user);
          setEditForm({
            name: data.user.name,
            className: data.user.className || "",
            nis: data.user.nis || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          className: editForm.className,
          nis: editForm.nis,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setToast(data.message || "Gagal memperbarui profil");
        return;
      }
      setProfile(data.user);
      setIsEditing(false);
      setToast("Profil berhasil diperbarui");
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({ name: profile.name, className: profile.className || "", nis: profile.nis || "" });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast("Password baru tidak cocok");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setToast("Password minimal 6 karakter");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      setToast(data.message || (data.success ? "Password berhasil diubah" : "Gagal mengubah password"));
      if (data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordForm(false);
      }
    } catch {
      setToast("Terjadi kesalahan koneksi");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // abaikan
    }
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        );
      case "guru":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <GraduationCap className="h-3 w-3" />
            Guru
          </span>
        );
      case "siswa":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <User className="h-3 w-3" />
            Siswa
          </span>
        );
      default:
        return null;
    }
  };

  if (!mounted || !profile) {
    return <p className="text-sm text-zinc-400">Memuat…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Profil</h1>
        <p className="mt-1 text-sm text-zinc-500">Kelola informasi profil Anda</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white">
              {getInitials(profile.name)}
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 shadow-sm hover:bg-zinc-50 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <h2 className="text-xl font-bold text-zinc-900">{profile.name}</h2>
              {getRoleBadge(profile.role)}
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {profile.className && `Kelas ${profile.className}`}
              {profile.className && profile.email && " · "}
              {profile.email}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? "Batal" : "Edit Profil"}
          </button>
        </div>
      </section>

      {isEditing ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Profil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={editForm.className}
                  onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">NIS</label>
                <input
                  type="text"
                  value={editForm.nis}
                  onChange={(e) => setEditForm({ ...editForm, nis: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Save className="mr-2 h-4 w-4 inline" />
                Simpan Perubahan
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Informasi Profil</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Nama Lengkap</p>
                <p className="font-medium text-zinc-900">{profile.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Email</p>
                <p className="font-medium text-zinc-900">{profile.email || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Kelas</p>
                <p className="font-medium text-zinc-900">{profile.className || "-"}</p>
              </div>
            </div>

            {profile.nis && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">NIS</p>
                  <p className="font-medium text-zinc-900">{profile.nis}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Role</p>
                <p className="font-medium text-zinc-900 capitalize">{profile.role}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Keamanan</h3>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Lock className="h-4 w-4" />
            Ubah Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password Saat Ini</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password Baru</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Ubah Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-rose-900">Keluar Akun</h3>
            <p className="mt-1 text-sm text-rose-700">
              Anda akan diarahkan ke halaman login setelah keluar
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl lg:bottom-24"
        >
          {toast}
        </div>
      )}
    </div>
  );
}