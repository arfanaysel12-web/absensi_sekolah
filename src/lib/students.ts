export type AttendanceStatus = "hadir" | "tidak_hadir" | "terlambat" | "izin" | "sakit" | "alpha" | null;

export interface Student {
  id: string;
  name: string;
  nis?: string;
  kelas?: string;
  jurusan?: string;
  email?: string;
  photo?: string;
}

export interface StudentWithStatus extends Student {
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photo?: string;
  notes?: string;
}

export interface SavedAttendance {
  date: string;
  records: Record<string, AttendanceRecord>;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  type: "izin" | "sakit";
  startDate: string;
  endDate: string;
  reason: string;
  evidence?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: "admin" | "guru" | "siswa";
  email?: string;
  photo?: string;
  className?: string;
  nis?: string;
}

export const DEFAULT_STUDENT_NAMES: string[] = [
  "Aditya Pratama",
  "Aisyah Putri Ramadhani",
  "Alif Maulana Yusuf",
  "Andini Cahya Ningrum",
  "Arfan Aysel",
  "Bagas Satrio Wibowo",
  "Bunga Citra Lestari",
  "Candra Wijaya Kusuma",
  "Citra Ayu Larasati",
  "Dafa Alfiansyah",
  "Dewi Anggraini",
  "Dimas Aditya Nugraha",
  "Dinda Kirana Salsabila",
  "Eko Prasetyo",
  "Fajar Ramadhan",
  "Fira Nadia Rahma",
  "Galih Permana",
  "Gita Rahmadani",
  "Hafiz Alghifari",
  "Intan Nabila",
  "Iqbal Fauzi",
  "Jihan Aulia Azzahra",
  "Kevin Wijaya",
  "Laras Maharani",
  "Muhammad Rizki",
  "Nabila Zahra",
  "Naufal Hidayat",
  "Putri Amelia",
  "Raka Febriansyah",
  "Salsabila Nur Fadilah",
];

export const STUDENTS: Student[] = DEFAULT_STUDENT_NAMES.map((name, index) => ({
  id: String(index + 1),
  name,
}));

export const STORAGE_KEY = "absensi-siswa";
export const STUDENTS_KEY = "absensi-students";
export const HISTORY_KEY = "absensi-history";
export const LEAVE_REQUESTS_KEY = "absensi-leave-requests";
export const NOTIFICATIONS_KEY = "absensi-notifications";
export const USER_PROFILE_KEY = "absensi-user-profile";
export const SETTINGS_KEY = "absensi-settings";

export function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
