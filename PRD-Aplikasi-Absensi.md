# Product Requirements Document (PRD)
## Aplikasi Absensi Siswa (Frontend Only)

---

## 1. Overview

| | |
|---|---|
| **Nama Produk** | Aplikasi Absensi Siswa |
| **Jenis** | Web Application (Frontend Only) |
| **Tech Stack** | Next.js, Tailwind CSS |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 11 Agustus 2026 |

### 1.1 Latar Belakang
Guru/wali kelas membutuhkan cara cepat dan sederhana untuk mencatat kehadiran siswa di kelas tanpa proses manual (kertas/buku absensi). Aplikasi ini menyediakan antarmuka digital untuk mencatat status hadir/tidak hadir per siswa dan melihat ringkasannya secara langsung.

### 1.2 Tujuan Produk
- Mempercepat proses pencatatan absensi harian
- Mengurangi kesalahan pencatatan manual
- Memberikan ringkasan kehadiran secara instan
- Menjadi fondasi (frontend) sebelum diintegrasikan dengan backend/database di tahap berikutnya

### 1.3 Target Pengguna
- Guru / Wali Kelas
- Admin sekolah (opsional, untuk versi lanjutan)

---

## 2. Ruang Lingkup (Scope)

### 2.1 Termasuk dalam Scope (In Scope)
- Menampilkan daftar nama siswa
- Menandai status kehadiran per siswa (Hadir / Tidak Hadir)
- Menyimpan data absensi (disimpan secara lokal di browser — localStorage)
- Menampilkan ringkasan jumlah hadir dan tidak hadir

### 2.2 Di Luar Scope (Out of Scope) untuk versi ini
- Integrasi backend/API/database sungguhan
- Autentikasi login guru/admin
- Riwayat absensi multi-hari/kalender
- Export laporan (PDF/Excel)
- Notifikasi ke orang tua siswa

---

## 3. User Stories

| ID | Sebagai | Saya ingin | Agar |
|---|---|---|---|
| US-01 | Guru | melihat daftar semua siswa di kelas | tahu siapa saja yang perlu diabsen |
| US-02 | Guru | menandai siswa sebagai "Hadir" atau "Tidak Hadir" | mencatat kehadiran dengan cepat |
| US-03 | Guru | mengubah status kehadiran yang sudah dipilih | jika terjadi kesalahan input |
| US-04 | Guru | melihat total siswa hadir & tidak hadir | mengetahui ringkasan kehadiran kelas |
| US-05 | Guru | menekan tombol simpan untuk menyimpan absensi | data tidak hilang saat halaman ditutup/refresh |
| US-06 | Guru | mendapat notifikasi saat absensi berhasil disimpan | yakin bahwa data sudah tersimpan |

---

## 4. Functional Requirements

### 4.1 Daftar Nama Siswa
- FR-1.1: Sistem menampilkan daftar siswa dalam bentuk list/tabel
- FR-1.2: Setiap item menampilkan nama siswa
- FR-1.3: Data siswa awal berasal dari data statis/dummy (belum dari backend)

### 4.2 Tombol Hadir / Tidak Hadir
- FR-2.1: Setiap siswa memiliki 2 tombol: **Hadir** dan **Tidak Hadir**
- FR-2.2: Saat salah satu tombol ditekan, status siswa tersebut ter-update
- FR-2.3: Tombol yang aktif/terpilih diberi indikator visual berbeda (warna/highlight)
- FR-2.4: Guru dapat mengubah status kapan saja sebelum disimpan

### 4.3 Ringkasan Kehadiran
- FR-3.1: Sistem menghitung otomatis jumlah siswa berstatus "Hadir"
- FR-3.2: Sistem menghitung otomatis jumlah siswa berstatus "Tidak Hadir"
- FR-3.3: Ringkasan diperbarui secara real-time setiap ada perubahan status
- FR-3.4: (Opsional) Menampilkan jumlah siswa yang belum diabsen

### 4.4 Simpan Absensi
- FR-4.1: Tersedia tombol "Simpan Absensi"
- FR-4.2: Saat ditekan, data absensi (status semua siswa) disimpan ke localStorage
- FR-4.3: Sistem menampilkan notifikasi/feedback bahwa data berhasil disimpan
- FR-4.4: Data yang tersimpan tetap ada meski halaman di-refresh

---

## 5. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Usability** | Antarmuka sederhana, mudah digunakan tanpa training |
| **Responsiveness** | Tampilan menyesuaikan di desktop & mobile (responsive design dengan Tailwind) |
| **Performance** | Perubahan status & perhitungan ringkasan terjadi instan (tanpa reload) |
| **Maintainability** | Kode terstruktur berbasis komponen (component-based) agar mudah dikembangkan |
| **Compatibility** | Berjalan baik di browser modern (Chrome, Firefox, Edge, Safari) |

---

## 6. Struktur Data

```ts
type AttendanceStatus = "hadir" | "tidak_hadir" | null;

interface Student {
  id: string;
  name: string;
  status: AttendanceStatus;
}
```

---

## 7. Alur Pengguna (User Flow)

1. Guru membuka aplikasi → daftar siswa langsung tampil
2. Guru menekan tombol **Hadir**/**Tidak Hadir** untuk tiap siswa
3. Ringkasan jumlah hadir/tidak hadir ter-update otomatis
4. Guru menekan tombol **Simpan Absensi**
5. Sistem menyimpan data & menampilkan notifikasi sukses

---

## 8. Wireframe (Konsep)

```
┌─────────────────────────────────────┐
│  📋 Absensi Siswa - Kelas X          │
├─────────────────────────────────────┤
│  Nama Siswa A     [Hadir] [Tdk Hadir]│
│  Nama Siswa B     [Hadir] [Tdk Hadir]│
│  Nama Siswa C     [Hadir] [Tdk Hadir]│
│  ...                                 │
├─────────────────────────────────────┤
│  Hadir: 15   |   Tidak Hadir: 3      │
│         [ Simpan Absensi ]           │
└─────────────────────────────────────┘
```

---

## 9. Rencana Pengembangan (Roadmap)

| Fase | Fitur |
|---|---|
| **Fase 1 (Sekarang)** | Daftar siswa, tombol hadir/tidak hadir, ringkasan, simpan ke localStorage |
| **Fase 2** | Integrasi backend/API & database |
| **Fase 3** | Autentikasi guru/admin |
| **Fase 4** | Riwayat absensi per tanggal, export laporan |

---

## 10. Metrik Keberhasilan (Success Metrics)
- Guru dapat menyelesaikan absensi 1 kelas (30 siswa) dalam waktu < 2 menit
- Tidak ada bug pada perhitungan ringkasan hadir/tidak hadir
- Data absensi tidak hilang setelah refresh halaman

---

## 11. Batasan (Constraints)
- Karena masih frontend only, data absensi **tidak tersimpan permanen di server** — hanya di browser (localStorage), sehingga bisa hilang jika cache/browser dibersihkan
- Belum mendukung multi-user secara bersamaan (belum ada backend)
