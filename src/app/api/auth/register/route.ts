import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, sanitizeUser, type UserRole } from '@/lib/auth';

export const runtime = 'nodejs';

const ROLES: UserRole[] = ['admin', 'guru', 'siswa'];

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = ROLES.includes(body.role as UserRole) ? (body.role as UserRole) : 'siswa';
    const className = typeof body.className === 'string' ? body.className.trim() : null;
    const nis = typeof body.nis === 'string' ? body.nis.trim() : null;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const existingList = existing as any[];
    if (existingList.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role, class_name, nis) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, role, className, nis]
    );
    const insert = result as { insertId: number };

    const [rows] = await connection.query(
      'SELECT id, name, email, role, class_name, nis, photo FROM users WHERE id = ? LIMIT 1',
      [insert.insertId]
    );
    const user = (rows as any[])[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Registrasi berhasil. Silakan login.',
        user: sanitizeUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Registrasi gagal. Pastikan server MySQL aktif dan database sudah diinisialisasi.',
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}