import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import {
  computeAttendanceStatus,
  getLateThreshold,
  nowTime,
  resolveStudentId,
  todayDate,
} from '@/lib/attendance';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim() : '';

    const date = todayDate();
    const time = nowTime();

    connection = await pool.getConnection();

    const studentId = await resolveStudentId(connection, {
      name: studentName || auth.user.name,
      email: auth.user.email,
      className: auth.user.className,
    });

    // Cek duplikat: siswa yang sama tidak boleh absen masuk 2x pada hari yang sama
    const [existing] = await connection.query(
      'SELECT id, status, check_in_time, check_out_time FROM attendance WHERE user_id = ? AND date = ? AND student_id = ? LIMIT 1',
      [auth.user.id, date, studentId]
    );
    const existingRows = existing as any[];
    if (existingRows.length > 0) {
      const rec = existingRows[0];
      return NextResponse.json(
        {
          success: true,
          message: 'Anda sudah absen masuk hari ini',
          alreadyCheckedIn: true,
          attendance: {
            id: rec.id,
            date,
            status: rec.status,
            checkInTime: rec.check_in_time,
            checkOutTime: rec.check_out_time,
          },
        },
        { status: 200 }
      );
    }

    const threshold = await getLateThreshold(connection);
    const status = computeAttendanceStatus(time, threshold);

    const [result] = await connection.query(
      `INSERT INTO attendance (student_id, user_id, date, status, check_in_time)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, auth.user.id, date, status, time]
    );
    const insert = result as { insertId: number };

    const [rows] = await connection.query(
      'SELECT * FROM attendance WHERE id = ? LIMIT 1',
      [insert.insertId]
    );
    const record = (rows as any[])[0];

    return NextResponse.json(
      {
        success: true,
        message: status === 'terlambat' ? 'Absen masuk tercatat (terlambat)' : 'Absen masuk berhasil',
        alreadyCheckedIn: false,
        attendance: {
          id: record.id,
          studentId: record.student_id,
          date: record.date,
          status: record.status,
          checkInTime: record.check_in_time,
          checkOutTime: record.check_out_time,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mencatat absen masuk. Pastikan database sudah diinisialisasi.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}