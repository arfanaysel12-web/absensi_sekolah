import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  response.cookies.delete(TOKEN_COOKIE_NAME);
  return response;
}