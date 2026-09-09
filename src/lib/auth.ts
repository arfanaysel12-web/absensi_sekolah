import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export type UserRole = 'admin' | 'guru' | 'siswa';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  className: string | null;
  nis: string | null;
  photo: string | null;
}

const JWT_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export const TOKEN_COOKIE_NAME = 'absen_token';

export function sanitizeUser(user: {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  class_name?: string | null;
  nis?: string | null;
  photo?: string | null;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    className: user.class_name ?? null,
    nis: user.nis ?? null,
    photo: user.photo ?? null,
  };
}

export const JWT_MAX_AGE_SECONDS = JWT_MAX_AGE;