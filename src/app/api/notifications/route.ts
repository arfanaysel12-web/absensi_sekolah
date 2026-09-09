import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api';

export const runtime = 'nodejs';

function serialize(n: any) {
  return {
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: Boolean(n.read),
    createdAt: n.created_at instanceof Date ? n.created_at.toISOString() : String(n.created_at).replace(' ', 'T') + 'Z',
    actionUrl: n.action_url || null,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [auth.user.id]
    );
    const list = rows as any[];
    return NextResponse.json({ success: true, notifications: list.map(serialize) });
  } catch (error) {
    console.error('List notifications error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil notifikasi' }, { status: 500 });
  } finally {
    connection?.release();
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    connection = await pool.getConnection();
    const isAll = body.all === true;
    const notificationId = Number(body.id);

    if (isAll) {
      await connection.query(
        'UPDATE notifications SET `read` = TRUE WHERE user_id = ?',
        [auth.user.id]
      );
    } else if (Number.isInteger(notificationId) && notificationId > 0) {
      await connection.query(
        'UPDATE notifications SET `read` = TRUE WHERE id = ? AND user_id = ?',
        [notificationId, auth.user.id]
      );
    } else {
      return NextResponse.json({ success: false, message: 'Parameter tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: isAll ? 'Semua notifikasi dibaca' : 'Notifikasi ditandai dibaca' });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui notifikasi' }, { status: 500 });
  } finally {
    connection?.release();
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = Number(searchParams.get('id'));

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return NextResponse.json({ success: false, message: 'ID notifikasi tidak valid' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, auth.user.id]);
    return NextResponse.json({ success: true, message: 'Notifikasi dihapus' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus notifikasi' }, { status: 500 });
  } finally {
    connection?.release();
  }
}