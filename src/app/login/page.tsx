"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GraduationCap, LogIn, Lock, Mail, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Login gagal");
        return;
      }
      const from = searchParams.get("from");
      window.location.href = from && from !== "/login" ? from : "/";
    } catch {
      setError("Terjadi kesalahan koneksi. Pastikan server berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Absensi Siswa</h1>
          <p className="mt-1 text-sm text-indigo-200">Kelas XI RPL 1 · Masuk ke akun Anda</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-indigo-900/30 sm:p-8">
          <h2 className="text-xl font-bold text-zinc-900">Masuk</h2>
          <p className="mt-1 text-sm text-zinc-500">Gunakan email dan password akun Anda.</p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:brightness-110 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Daftar di sini
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-indigo-200">
          Akun demo: admin@sekolah.sch.id / admin123 · siswa@sekolah.sch.id / siswa123
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm text-white">Memuat…</p>}>
      <LoginForm />
    </Suspense>
  );
}