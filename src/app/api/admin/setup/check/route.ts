import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if any super admin exists
    const userCount = await prisma.user.count();

    return NextResponse.json({
      allowed: userCount === 0,
      hasUsers: userCount > 0,
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Não foi possível verificar o status do setup. Verifique a conexão com o banco de dados.' },
      { status: 500 },
    );
  }
}
