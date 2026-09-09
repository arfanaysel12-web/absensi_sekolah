import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import { resolveStudentId } from '@/lib/attendance';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    const type = body.type === 'sakit' ? 'sakit' : 'izin';
    const startDate = typeof body.startDate === 'string' ? body.startDate : '';
    const endDate = typeof body.endDate === 'string' ? body.endDate : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const evidence = typeof body.evidence === 'string' && body.evidence ? body.evidence.trim() : null;
    const isStaff = auth.user.role === 'admin' || auth.user.role === 'guru';
    const requestedStudentId = body.studentId ? Number(body.studentId) : null;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'Tanggal mulai, tanggal selesai, dan alasan wajib diisi' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: 'Tanggal selesai tidak boleh sebelum tanggal mulai' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    let studentId: number | null = null;
    let studentName: string;

    if (isStaff && requestedStudentId) {
      const [rows] = await connection.query(
        'SELECT id, name FROM students WHERE id = ? LIMIT 1',
        [requestedStudentId]
      );
      const list = rows as any[];
      if (list.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Siswa tidak ditemukan' },
          { status: 404 }
        );
      }
      studentId = list[0].id;
      studentName = list[0].name;
    } else {
      studentName = auth.user.name;
      studentId = await resolveStudentId(connection, {
        name: auth.user.name,
        email: auth.user.email,
        className: auth.user.className,
      });
    }

    const [result] = await connection.query(
      `INSERT INTO leave_requests (student_id, student_name, user_id, type, start_date, end_date, reason, evidence, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [studentId, studentName, auth.user.id, type, startDate, endDate, reason, evidence]
    );
    const insert = result as { insertId: number };

    // Buat notifikasi untuk admin/guru
    try {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type, action_url)
         SELECT id, ?, ?, 'info', '/admin'
         FROM users WHERE role IN ('admin', 'guru') AND id <> ?`,
        ['Pengajuan Baru', `${studentName} mengajukan ${type === 'sakit' ? 'sakit' : 'izin'}.`, auth.user.id]
      );
    } catch {
      // notifikasi tidak memblokir proses utama
    }

    const [rows] = await connection.query(
      `SELECT lr.id, lr.student_id, lr.student_name, lr.type, lr.start_date, lr.end_date, lr.reason, lr.evidence, lr.status, lr.submitted_at
       FROM leave_requests lr WHERE lr.id = ? LIMIT 1`,
      [insert.insertId]
    );
    const record = (rows as any[])[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan berhasil dikirim',
        request: serializeLeaveRequest(record),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat pengajuan. Pastikan database sudah diinisialisasi.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    connection = await pool.getConnection();

    if (auth.user.role === 'siswa') {
      const [rows] = await connection.query(
        `SELECT lr.id, lr.student_id, lr.student_name, lr.type, lr.start_date, lr.end_date, lr.reason, lr.evidence, lr.status, lr.submitted_at, lr.reviewed_at, lr.review_notes,
                reviewer.name AS reviewed_by_name
         FROM leave_requests lr
         LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
         WHERE lr.user_id = ?
         ORDER BY lr.submitted_at DESC`,
        [auth.user.id]
      );
      const list = rows as any[];
      return NextResponse.json({ success: true, requests: list.map(serializeLeaveRequest) });
    }

    const [rows] = await connection.query(
      `SELECT lr.id, lr.student_id, lr.student_name, lr.type, lr.start_date, lr.end_date, lr.reason, lr.evidence, lr.status, lr.submitted_at, lr.reviewed_at, lr.review_notes,
              reviewer.name AS reviewed_by_name
       FROM leave_requests lr
       LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
       ORDER BY lr.submitted_at DESC`
    );
    const list = rows as any[];
    return NextResponse.json({ success: true, requests: list.map(serializeLeaveRequest) });
  } catch (error) {
    console.error('List leave requests error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar pengajuan' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

function serializeLeaveRequest(r: any) {
  const rawDate = (v: any) => {
    if (v instanceof Date) {
      return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    return String(v).slice(0, 10);
  };
  const rawTimestamp = (v: any) => {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString();
    return String(v).replace(' ', 'T') + 'Z';
  };
  return {
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    type: r.type,
    startDate: rawDate(r.start_date),
    endDate: rawDate(r.end_date),
    reason: r.reason,
    evidence: r.evidence,
    status: r.status,
    submittedAt: rawTimestamp(r.submitted_at),
    reviewedAt: rawTimestamp(r.reviewed_at),
    reviewNotes: r.review_notes,
    reviewedByName: r.reviewed_by_name || null,
  };
}