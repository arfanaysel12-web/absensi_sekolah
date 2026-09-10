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

export const CLASS_OPTIONS = [
  "X RPL 1",
  "X RPL 2",
  "X RPL 3",
  "X AK 1",
  "X AK 2",
  "X AK 3",
  "X BR 1",
  "X BR 2",
  "X BR 3",
  "X MP 1",
  "X MP 2",
  "X MP 3",
  "XI RPL 1",
  "XI RPL 2",
  "XI RPL 3",
  "XI AK 1",
  "XI AK 2",
  "XI AK 3",
  "XI BR 1",
  "XI BR 2",
  "XI BR 3",
  "XI MP 1",
  "XI MP 2",
  "XI MP 3",
  "XII RPL 1",
  "XII RPL 2",
  "XII RPL 3",
  "XII AK 1",
  "XII AK 2",
  "XII AK 3",
  "XII BR 1",
  "XII BR 2",
  "XII BR 3",
  "XII MP 1",
  "XII MP 2",
  "XII MP 3",
];

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

const distributeStudents = (names: string[]): Student[] => {
  const classes = ["X RPL", "X AK", "X BR", "X MP", "XI RPL", "XI AK", "XI BR", "XI MP", "XII RPL", "XII AK", "XII BR", "XII MP"];
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const students: Student[] = [];
  let idx = 0;
  for (let i = 0; i < classes.length && idx < shuffled.length; i++) {
    const studentCount = i < 4 ? 3 : 2; // First 4 classes (grade X) get 3 students, rest get 2
    for (let j = 0; j < studentCount && idx < shuffled.length; j++) {
      students.push({
        id: String(students.length + 1),
        name: shuffled[idx],
        kelas: classes[i],
      });
      idx++;
    }
  }
  return students;
};

export const STUDENTS: Student[] = distributeStudents(DEFAULT_STUDENT_NAMES);

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
