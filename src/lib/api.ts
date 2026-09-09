import { NextRequest, NextResponse } from 'next/server';
import pool from './db';
import {
  TOKEN_COOKIE_NAME,
  extractTokenFromRequest,
  sanitizeUser,
  verifyToken,
  type JWTPayload,
  type SafeUser,
  type UserRole,
} from './auth';

export type { SafeUser, UserRole };

export type AuthResult =
  | { user: SafeUser }
  | { response: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Anda harus masuk terlebih dahulu' },
    { status: 401 }
  );
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Anda tidak memiliki akses' },
    { status: 403 }
  );
}

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return extractTokenFromRequest(request.headers.get('authorization'));
}

async function fetchUserById(userId: number): Promise<SafeUser | null> {
  let connection;
  try {
    connection = await pool.getConnection();
  } catch {
    return null;
  }
  try {
    const [rows] = await connection.query(
      'SELECT id, name, email, role, class_name, nis, photo FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = (rows as any[])[0] ?? null;
    if (!user) return null;
    return sanitizeUser(user);
  } catch {
    return null;
  } finally {
    connection.release();
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = getTokenFromRequest(request);
  if (!token) return { response: unauthorized() };

  const payload: JWTPayload | null = verifyToken(token);
  if (!payload) return { response: unauthorized() };

  const user = await fetchUserById(payload.userId);
  if (!user) return { response: unauthorized() };

  return { user };
}

export async function requireRole(
  request: NextRequest,
  roles: UserRole[]
): Promise<AuthResult> {
  const result = await requireAuth(request);
  if ('response' in result) return result;

  if (!roles.includes(result.user.role)) {
    return { response: forbidden() };
  }

  return result;
}

export function isAdmin(user: SafeUser): boolean {
  return user.role === 'admin';
}

export function isStaff(user: SafeUser): boolean {
  return user.role === 'admin' || user.role === 'guru';
}