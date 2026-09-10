import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal menginisialisasi database'
      },
      { status: 500 }
    );
  }
}