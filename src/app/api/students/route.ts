import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireRole } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, name, nis, class, jurusan, email, photo FROM students ORDER BY id'
    );
    const list = rows as any[];
    return NextResponse.json({
      success: true,
      students: list.map((s) => ({
        id: String(s.id),
        name: s.name,
        nis: s.nis,
        class: s.class,
        jurusan: s.jurusan,
        email: s.email,
        photo: s.photo,
      })),
    });
  } catch (error) {
    console.error('List students error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data siswa' }, { status: 500 });
  } finally {
    connection?.release();
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['admin', 'guru']);
  if ('response' in auth) return auth.response;

  let connection;
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const nis = typeof body.nis === 'string' && body.nis ? body.nis.trim() : null;
    const classYear = typeof body.class === 'string' && body.class ? body.class.trim() : null;
    const jurusan = typeof body.jurusan === 'string' && body.jurusan ? body.jurusan.trim() : null;
    const email = typeof body.email === 'string' && body.email ? body.email.trim() : null;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Nama siswa wajib diisi' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO students (name, nis, class, jurusan, email) VALUES (?, ?, ?, ?, ?)',
      [name, nis, classYear, jurusan, email]
    );
    const insert = result as { insertId: number };

    return NextResponse.json(
      { success: true, message: 'Siswa berhasil ditambahkan', student: { id: String(insert.insertId), name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menambahkan siswa' }, { status: 500 });
  } finally {
    connection?.release();
  }
}