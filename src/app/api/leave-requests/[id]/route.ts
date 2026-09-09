import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const { id } = await params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json({ success: false, message: 'ID pengajuan tidak valid' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, user_id, status FROM leave_requests WHERE id = ? LIMIT 1',
      [requestId]
    );
    const list = rows as any[];
    if (list.length === 0) {
      return NextResponse.json({ success: false, message: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }
    const row = list[0];

    const isStaff = auth.user.role === 'admin' || auth.user.role === 'guru';
    const isOwner = row.user_id === auth.user.id;

    if (!isStaff && !isOwner) {
      return NextResponse.json({ success: false, message: 'Anda tidak berhak menghapus pengajuan ini' }, { status: 403 });
    }
    if (row.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Pengajuan yang sudah diproses tidak dapat dihapus' }, { status: 400 });
    }

    await connection.query('DELETE FROM leave_requests WHERE id = ?', [requestId]);
    return NextResponse.json({ success: true, message: 'Pengajuan berhasil dihapus' });
  } catch (error) {
    console.error('Delete leave request error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus pengajuan' }, { status: 500 });
  } finally {
    connection?.release();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const { id } = await params;
    const requestId = Number(id);
    const body = await request.json();
    const action = body.action === 'reject' ? 'reject' : 'approve';
    const reviewNotes = typeof body.reviewNotes === 'string' && body.reviewNotes ? body.reviewNotes.trim() : null;

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        { success: false, message: 'ID pengajuan tidak valid' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, student_name, type, user_id FROM leave_requests WHERE id = ? LIMIT 1',
      [requestId]
    );
    const list = rows as any[];
    if (list.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }
    const requestRow = list[0];

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await connection.query(
      'UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?',
      [newStatus, auth.user.id, reviewNotes, requestId]
    );

    // Notifikasi ke pengaju
    if (requestRow.user_id) {
      try {
        await connection.query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, ?, ?, ?, ?)`,
          [
            requestRow.user_id,
            newStatus === 'approved' ? 'Pengajuan Disetujui' : 'Pengajuan Ditolak',
            `Pengajuan ${requestRow.type === 'sakit' ? 'sakit' : 'izin'} ${requestRow.student_name} ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}.`,
            newStatus === 'approved' ? 'success' : 'error',
            '/pengajuan-izin',
          ]
        );
      } catch {
        // jangan blokir
      }
    }

    return NextResponse.json({ success: true, message: 'Status pengajuan diperbarui' });
  } catch (error) {
    console.error('Review leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pengajuan' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}