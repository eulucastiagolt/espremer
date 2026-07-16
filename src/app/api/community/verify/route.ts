import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  const verification = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!verification || verification.expiresAt < new Date()) return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.delete({ where: { token } }),
  ]);
  return NextResponse.json({ ok: true });
}
