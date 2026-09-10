import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';
import { sanitizeUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  return NextResponse.json({ success: true, user: auth.user });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null;
    const className = typeof body.className === 'string' ? body.className.trim() : null;
    const nis = typeof body.nis === 'string' ? body.nis.trim() : null;

    if (!name && className === null && nis === null) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data yang diperbarui' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    if (name) {
      await connection.query('UPDATE users SET name = ? WHERE id = ?', [name, auth.user.id]);
    }
    if (className !== null) {
      await connection.query('UPDATE users SET class_name = ? WHERE id = ?', [className || null, auth.user.id]);
    }
    if (nis !== null) {
      await connection.query('UPDATE users SET nis = ? WHERE id = ?', [nis || null, auth.user.id]);
    }

    const [rows] = await connection.query(
      'SELECT id, name, email, role, class_name, nis, photo FROM users WHERE id = ? LIMIT 1',
      [auth.user.id]
    );
    const user = (rows as any[])[0];
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui profil' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}