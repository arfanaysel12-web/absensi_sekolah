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

    const where = auth.user.role === 'siswa' ? 'WHERE a.user_id = ?' : '';
    const params = auth.user.role === 'siswa' ? [auth.user.id] : [];

    const [counts] = await connection.query(
      `SELECT status, COUNT(*) AS total FROM attendance a ${where} GROUP BY status`,
      params
    );
    const countRows = counts as any[];

    const [dates] = await connection.query(
      `SELECT COUNT(DISTINCT date) AS total FROM attendance a ${where}`,
      params
    );
    const dateRows = dates as any[];

    const getCount = (status: string) => {
      const row = countRows.find((r) => r.status === status);
      return row ? Number(row.total) : 0;
    };

    const hadir = getCount('hadir');
    const terlambat = getCount('terlambat');
    const izin = getCount('izin');
    const sakit = getCount('sakit');
    const alpha = getCount('alpha');
    const tidakHadir = getCount('tidak_hadir');

    const totalRecords = hadir + terlambat + izin + sakit + alpha + tidakHadir;
    const totalDays = Number(dateRows[0]?.total ?? 0);
    const attendanceRate =
      totalRecords > 0 ? Math.round(((hadir + terlambat) / totalRecords) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        hadir,
        terlambat,
        izin,
        sakit,
        alpha,
        tidakHadir,
        totalRecords,
        totalDays,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error('Attendance stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil statistik kehadiran' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}