import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const { id } = await params;
    const studentId = Number(id);
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ success: false, message: 'ID siswa tidak valid' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, message: 'Nama siswa wajib diisi' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT id FROM students WHERE id = ? LIMIT 1', [studentId]);
    if ((existing as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    await connection.query('UPDATE students SET name = ? WHERE id = ?', [name, studentId]);
    return NextResponse.json({ success: true, message: 'Siswa berhasil diperbarui' });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui siswa' }, { status: 500 });
  } finally {
    connection?.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const { id } = await params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json({ success: false, message: 'ID siswa tidak valid' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.query('DELETE FROM students WHERE id = ?', [studentId]);
    return NextResponse.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus siswa' }, { status: 500 });
  } finally {
    connection?.release();
  }
}