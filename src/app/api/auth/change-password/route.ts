import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import { verifyPassword, hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, password FROM users WHERE id = ? LIMIT 1',
      [auth.user.id]
    );
    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini salah' },
        { status: 401 }
      );
    }

    const hashed = await hashPassword(newPassword);
    await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashed, auth.user.id]);

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengubah password. Pastikan server MySQL aktif.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}