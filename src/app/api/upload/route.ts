import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diupload' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Tipe file tidak didukung. Hanya JPG, JPEG, PNG, PDF, DOC, dan DOCX yang diperbolehkan' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar. Maksimal 20MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename based on verified content extension
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = detectExtension(bytes, file.type);
    if (!ext) {
      return NextResponse.json(
        { success: false, message: 'Isi file tidak valid. Hanya JPG, JPEG, PNG, PDF, DOC, dan DOCX yang diperbolehkan' },
        { status: 400 }
      );
    }

    // Validate that detected extension matches declared MIME type
    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/jpg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    };
    const allowedExtensions = validExtensions[file.type] || [];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, message: 'Isi file tidak sesuai dengan tipe file yang dideklarasikan' },
        { status: 400 }
      );
    }
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomString}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, bytes);

    // Return the public URL
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload',
      filename,
      url: publicUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengupload file' },
      { status: 500 }
    );
  }
}

function detectExtension(buf: Buffer, mimeType: string): string | null {
  // PDF
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return '.pdf';
  }
  // JPEG
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return '.jpg';
  }
  // PNG
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) {
    return '.png';
  }
  // DOC (OLE2 format)
  if (buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0 && buf[4] === 0xa1 && buf[5] === 0xb1 && buf[6] === 0x1a && buf[7] === 0xe1) {
    return '.doc';
  }
  // DOCX (ZIP format - Office Open XML)
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) && (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08)) {
    // For docx, we trust the MIME type since many zip files exist
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return '.docx';
    }
  }
  return null;
}
