import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import { nowTime, todayDate } from '@/lib/attendance';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const date = todayDate();
    const time = nowTime();

    connection = await pool.getConnection();

    // Cari record absen masuk hari ini untuk user ini
    const [rows] = await connection.query(
      'SELECT id, check_in_time, check_out_time FROM attendance WHERE user_id = ? AND date = ? ORDER BY id LIMIT 1',
      [auth.user.id, date]
    );
    const records = rows as any[];

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Anda belum absen masuk hari ini' },
        { status: 400 }
      );
    }

    if (records[0].check_in_time === null) {
      return NextResponse.json(
        { success: false, message: 'Anda belum absen masuk hari ini' },
        { status: 400 }
      );
    }

    if (records[0].check_out_time !== null) {
      return NextResponse.json(
        {
          success: true,
          message: 'Anda sudah absen pulang hari ini',
          alreadyCheckedOut: true,
          checkOutTime: records[0].check_out_time,
        },
        { status: 200 }
      );
    }

    await connection.query(
      'UPDATE attendance SET check_out_time = ? WHERE id = ?',
      [time, records[0].id]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Absen pulang berhasil',
        alreadyCheckedOut: false,
        checkOutTime: time,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mencatat absen pulang. Pastikan database sudah diinisialisasi.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}