import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateToken, sanitizeUser, TOKEN_COOKIE_NAME, JWT_MAX_AGE_SECONDS, verifyPassword } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, name, email, password, role, class_name, nis, photo FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      const user = (users as any[])[0] ?? null;

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Email atau password salah' },
          { status: 401 }
        );
      }

      const isValidPassword = await verifyPassword(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: 'Email atau password salah' },
          { status: 401 }
        );
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const safeUser = sanitizeUser(user);

      const response = NextResponse.json({
        success: true,
        message: 'Login berhasil',
        user: safeUser,
      });

      response.cookies.set(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: JWT_MAX_AGE_SECONDS,
      });

      return response;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Login gagal. Pastikan server MySQL aktif dan database sudah diinisialisasi.',
      },
      { status: 500 }
    );
  }
}