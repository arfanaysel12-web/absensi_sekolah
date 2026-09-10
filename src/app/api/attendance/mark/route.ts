import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api';
import { nowTime, todayDate } from '@/lib/attendance';

export const runtime = 'nodejs';

const VALID_STATUSES = ['hadir', 'tidak_hadir', 'terlambat', 'izin', 'sakit', 'alpha'];

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Request body tidak valid' },
        { status: 400 }
      );
    }
    const studentId = Number(body.studentId);
    const status = typeof body.status === 'string' ? body.status : null;
    const date = typeof body.date === 'string' && body.date ? body.date : todayDate();
    const checkInTime = typeof body.checkInTime === 'string' && body.checkInTime ? body.checkInTime : null;

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { success: false, message: 'studentId wajib diisi' },
        { status: 400 }
      );
    }

    if (status !== null && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status absensi tidak valid' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [studentRows] = await connection.query(
      'SELECT id FROM students WHERE id = ? LIMIT 1',
      [studentId]
    );
    const studentList = studentRows as any[];
    if (studentList.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    const [existing] = await connection.query(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ? AND student_id = ? LIMIT 1',
      [auth.user.id, date, studentId]
    );
    const existingList = existing as any[];
    const existingId = existingList.length > 0 ? existingList[0].id : null;

    if (status === null) {
      // Hapus status (toggle off)
      if (existingId) {
        await connection.query('DELETE FROM attendance WHERE id = ?', [existingId]);
      }
      return NextResponse.json({ success: true, message: 'Status siswa direset' });
    }

    const time = checkInTime || (status === 'hadir' || status === 'terlambat' ? nowTime() : null);

    if (existingId) {
      await connection.query(
        'UPDATE attendance SET status = ?, check_in_time = COALESCE(?, check_in_time) WHERE id = ?',
        [status, time, existingId]
      );
    } else {
      await connection.query(
        `INSERT INTO attendance (student_id, user_id, date, status, check_in_time)
         VALUES (?, ?, ?, ?, ?)`,
        [studentId, auth.user.id, date, status, time]
      );
    }

    return NextResponse.json({ success: true, message: 'Status absensi siswa disimpan' });
  } catch (error) {
    console.error('Attendance mark error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan status absensi siswa' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}