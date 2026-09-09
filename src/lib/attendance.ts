import type { Connection, Pool } from 'mysql2/promise';

export function todayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

interface StudentResolveInput {
  name?: string;
  email?: string;
  className?: string | null;
}

export async function resolveStudentId(
  db: Pool | Connection,
  input: StudentResolveInput
): Promise<number | null> {
  const { name, email, className } = input;

  if (name) {
    const [byName] = await db.query(
      'SELECT id FROM students WHERE name = ? ORDER BY id LIMIT 1',
      [name]
    );
    const nameRows = byName as any[];
    if (nameRows.length > 0) return nameRows[0].id;
  }

  if (email) {
    const [byEmail] = await db.query(
      'SELECT id FROM students WHERE email = ? ORDER BY id LIMIT 1',
      [email]
    );
    const emailRows = byEmail as any[];
    if (emailRows.length > 0) return emailRows[0].id;
  }

  if (name) {
    const [result] = await db.query(
      'INSERT INTO students (name, email, class) VALUES (?, ?, ?)',
      [name, email || null, className || 'XI RPL 1']
    );
    const insert = result as { insertId: number };
    console.log(`New student created automatically: ${name} -> id ${insert.insertId}`);
    return insert.insertId;
  }

  return null;
}

export async function getLateThreshold(db: Pool | Connection): Promise<string> {
  try {
    const [rows] = await db.query(
      'SELECT value FROM settings WHERE `key` = ? LIMIT 1',
      ['late_threshold']
    );
    const list = rows as any[];
    if (list.length > 0 && list[0].value) return String(list[0].value);
  } catch {
    // fall through
  }
  return process.env.LATE_THRESHOLD || '07:30';
}

export function computeAttendanceStatus(checkInTime: string, threshold: string): 'hadir' | 'terlambat' {
  const normalize = (t: string) => {
    const [h, m] = t.split(':').map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  };
  const timeMin = normalize(checkInTime);
  const thrMin = normalize(threshold);
  return timeMin <= thrMin ? 'hadir' : 'terlambat';
}

export function isSameOrBefore(timeA: string, timeB: string): boolean {
  const normalize = (t: string) => {
    const [h, m] = t.split(':').map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  };
  return normalize(timeA) <= normalize(timeB);
}