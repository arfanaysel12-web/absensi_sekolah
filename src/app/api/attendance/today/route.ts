import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import { todayDate } from '@/lib/attendance';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const date = todayDate();
    connection = await pool.getConnection();

    if (auth.user.role === 'siswa') {
      const [rows] = await connection.query(
        `SELECT a.id, a.student_id, a.user_id, a.date, a.status, a.check_in_time, a.check_out_time,
                COALESCE(s.name, u.name) AS student_name
         FROM attendance a
         LEFT JOIN students s ON a.student_id = s.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.date = ? AND a.user_id = ?
         ORDER BY a.id LIMIT 1`,
        [date, auth.user.id]
      );
      const records = rows as any[];
      return NextResponse.json({
        success: true,
        date,
        attendance: records[0]
          ? {
              id: records[0].id,
              studentName: records[0].student_name,
              status: records[0].status,
              checkInTime: records[0].check_in_time,
              checkOutTime: records[0].check_out_time,
            }
          : null,
      });
    }

    // Staff/Admin: seluruh rekap hari ini
    const [rows] = await connection.query(
      `SELECT a.id, a.student_id, a.user_id, a.date, a.status, a.check_in_time, a.check_out_time,
              COALESCE(s.name, u.name) AS student_name,
              u.name AS user_name
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.date = ?
       ORDER BY a.check_in_time ASC,
                COALESCE(s.name, u.name) ASC`,
      [date]
    );
    const records = rows as any[];

    const [studentRows] = await connection.query(
      'SELECT id, name FROM students ORDER BY id'
    );
    const students = studentRows as any[];

    return NextResponse.json({ success: true, date, attendanceList: records, students });
  } catch (error) {
    console.error('Attendance today error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data absensi hari ini' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}