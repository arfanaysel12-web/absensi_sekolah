import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT a.id, a.student_id, a.user_id, a.date, a.status, a.check_in_time, a.check_out_time,
             COALESCE(s.name, u.name) AS student_name,
             s.class AS student_class,
             u.name AS user_name
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      ${auth.user.role === 'siswa' ? 'WHERE a.user_id = ?' : ''}
      ORDER BY a.date DESC, a.check_in_time ASC
    `;

    const params = auth.user.role === 'siswa' ? [auth.user.id] : [];
    const [rows] = await connection.query(query, params);
    const records = rows as any[];

    // Kelompokkan per tanggal
    const toDateKey = (value: any): string => {
      if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
      }
      return String(value).slice(0, 10);
    };

    const grouped: Record<string, any[]> = {};
    for (const r of records) {
      const date = toDateKey(r.date);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name || r.user_name,
        userClassName: r.student_class,
        status: r.status,
        checkInTime: r.check_in_time,
        checkOutTime: r.check_out_time,
      });
    }

    const entries = Object.keys(grouped)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => ({ date, records: grouped[date] }));

    return NextResponse.json({
      success: true,
      entries,
      totalRecords: records.length,
    });
  } catch (error) {
    console.error('Attendance history error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat absensi' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}