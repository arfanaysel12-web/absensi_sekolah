"use client";

import {
  DEFAULT_STUDENT_NAMES,
  HISTORY_KEY,
  STORAGE_KEY,
  STUDENTS_KEY,
  todayKey,
  type AttendanceStatus,
  type SavedAttendance,
  type Student,
  type AttendanceRecord,
  type LeaveRequest,
  type Notification,
  type UserProfile,
  LEAVE_REQUESTS_KEY,
  NOTIFICATIONS_KEY,
  USER_PROFILE_KEY,
} from "@/lib/students";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy errors
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

type StoredRecord = AttendanceRecord | AttendanceStatus;

function readHistory(): Record<string, Record<string, StoredRecord>> {
  try {
    const raw = safeGet(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Record<string, StoredRecord>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readCurrentRecords(date: string): Record<string, StoredRecord> {
  const history = readHistory();
  return history[date] ?? {};
}

export function getSavedStudents(): Student[] {
  try {
    const raw = safeGet(STUDENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Student[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((s) => s && s.id && s.name)) {
        return parsed;
      }
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_STUDENT_NAMES.map((name, index) => ({ id: String(index + 1), name }));
}

export function saveStudents(students: Student[]): void {
  safeSet(STUDENTS_KEY, JSON.stringify(students));
}

export function addStudent(name: string): Student[] {
  const students = getSavedStudents();
  const nextId =
    students.length > 0
      ? String(Math.max(...students.map((s) => Number(s.id))) + 1)
      : "1";
  const updated = [...students, { id: nextId, name: name.trim() }];
  saveStudents(updated);
  return updated;
}

export function updateStudent(id: string, name: string): Student[] {
  const students = getSavedStudents().map((s) =>
    s.id === id ? { ...s, name: name.trim() } : s,
  );
  saveStudents(students);
  return students;
}

export function deleteStudent(id: string): Student[] {
  const students = getSavedStudents().filter((s) => s.id !== id);
  saveStudents(students);
  return students;
}

export function getTodayRecords(): Record<string, StoredRecord> {
  return readCurrentRecords(todayKey());
}

export function saveTodayRecords(records: Record<string, AttendanceRecord>): void {
  const date = todayKey();
  const history = readHistory();
  history[date] = records;
  safeSet(HISTORY_KEY, JSON.stringify(history));
}

export function resetTodayRecords(): void {
  const date = todayKey();
  const history = readHistory();
  delete history[date];
  safeSet(HISTORY_KEY, JSON.stringify(history));
}

export function getHistoryDates(): string[] {
  return Object.keys(readHistory()).sort((a, b) => (a < b ? 1 : -1));
}

export function getRecordsForDate(date: string): Record<string, StoredRecord> {
  return readCurrentRecords(date);
}

export function getFullHistory(): Record<string, Record<string, StoredRecord>> {
  return readHistory();
}

export function migrateLegacy(): void {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as SavedAttendance;
    if (parsed && parsed.date && parsed.records) {
      const history = readHistory();
      if (!history[parsed.date]) {
        history[parsed.date] = parsed.records;
        safeSet(HISTORY_KEY, JSON.stringify(history));
      }
      safeRemove(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

// Leave Requests functions
export function getLeaveRequests(): LeaveRequest[] {
  try {
    const raw = safeGet(LEAVE_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaveRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  safeSet(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
}

export function addLeaveRequest(request: Omit<LeaveRequest, "id" | "submittedAt">): LeaveRequest {
  const requests = getLeaveRequests();
  const newRequest: LeaveRequest = {
    ...request,
    id: Date.now().toString(),
    submittedAt: new Date().toISOString(),
  };
  saveLeaveRequests([...requests, newRequest]);
  return newRequest;
}

export function updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): LeaveRequest | null {
  const requests = getLeaveRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  
  const updated = { ...requests[index], ...updates };
  requests[index] = updated;
  saveLeaveRequests(requests);
  return updated;
}

export function deleteLeaveRequest(id: string): boolean {
  const requests = getLeaveRequests();
  const filtered = requests.filter((r) => r.id !== id);
  if (filtered.length === requests.length) return false;
  saveLeaveRequests(filtered);
  return true;
}

// Notifications functions
export function getNotifications(): Notification[] {
  try {
    const raw = safeGet(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Notification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: Notification[]): void {
  safeSet(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function addNotification(notification: Omit<Notification, "id" | "createdAt">): Notification {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  saveNotifications([newNotification, ...notifications]);
  return newNotification;
}

export function markNotificationAsRead(id: string): boolean {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return false;
  
  notifications[index].read = true;
  saveNotifications(notifications);
  return true;
}

export function markAllNotificationsAsRead(): void {
  const notifications = getNotifications();
  notifications.forEach((n) => n.read = true);
  saveNotifications(notifications);
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

// User Profile functions
export function getUserProfile(): UserProfile | null {
  try {
    const raw = safeGet(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  safeSet(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
  const current = getUserProfile();
  if (!current) return null;
  
  const updated = { ...current, ...updates };
  saveUserProfile(updated);
  return updated;
}

// Migration for attendance records format
export function migrateAttendanceRecords(): void {
  const history = readHistory();
  let needsMigration = false;
  
  for (const date in history) {
    const records = history[date];
    for (const studentId in records) {
      const status = records[studentId];
      // If status is not an object, it's the old format
      if (typeof status !== 'object' || status === null) {
        const newRecord: AttendanceRecord = {
          studentId,
          status: status as AttendanceStatus,
          checkInTime: status === 'hadir' ? '08:00' : undefined,
        };
        records[studentId] = newRecord as any;
        needsMigration = true;
      }
    }
  }
  
  if (needsMigration) {
    safeSet(HISTORY_KEY, JSON.stringify(history));
  }
}

// Helper functions for attendance statistics
export function getAttendanceStats(studentId?: string) {
  const history = readHistory();
  const students = getSavedStudents();
  const targetStudents = studentId ? students.filter(s => s.id === studentId) : students;
  
  let hadir = 0, terlambat = 0, izin = 0, sakit = 0, alpha = 0, tidakHadir = 0;
  
  for (const date in history) {
    const records = history[date];
    for (const student of targetStudents) {
      const record = records[student.id];
      if (!record) continue;
      
      const status = record !== null && typeof record === 'object' ? record.status : record;
      switch (status) {
        case 'hadir': hadir++; break;
        case 'terlambat': terlambat++; break;
        case 'izin': izin++; break;
        case 'sakit': sakit++; break;
        case 'alpha': alpha++; break;
        case 'tidak_hadir': tidakHadir++; break;
      }
    }
  }
  
  const totalDays = Object.keys(history).length;
  const totalRecords = hadir + terlambat + izin + sakit + alpha + tidakHadir;
  const attendanceRate = totalRecords > 0 ? Math.round(((hadir + terlambat) / totalRecords) * 100) : 0;
  
  return { hadir, terlambat, izin, sakit, alpha, tidakHadir, totalDays, attendanceRate };
}

// Helper function for calendar data
export function getCalendarData(year: number, month: number, studentId?: string) {
  const history = readHistory();
  const students = getSavedStudents();
  const targetStudents = studentId ? students.filter(s => s.id === studentId) : students;
  
  const calendarData: Record<string, AttendanceStatus> = {};
  
  for (const date in history) {
    const [y, m, d] = date.split('-').map(Number);
    if (y === year && m === month + 1) {
      const records = history[date];
      let dominantStatus: AttendanceStatus = null;
      
      // For multiple students, find the most common status
      const statusCount: Record<string, number> = {};
      for (const student of targetStudents) {
        const record = records[student.id];
        if (!record) continue;
        
        const status = record !== null && typeof record === 'object' ? record.status : record;
        if (status) {
          statusCount[status] = (statusCount[status] || 0) + 1;
        }
      }
      
      // Find the status with highest count
      let maxCount = 0;
      for (const [status, count] of Object.entries(statusCount)) {
        if (count > maxCount) {
          maxCount = count;
          dominantStatus = status as AttendanceStatus;
        }
      }
      
      if (dominantStatus) {
        calendarData[date] = dominantStatus;
      }
    }
  }
  
  return calendarData;
}
