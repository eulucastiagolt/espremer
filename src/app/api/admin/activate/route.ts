import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { consumeAdminInvitation } from '@/lib/admin-invitations';

export async function POST(request: NextRequest) {
  const { token, password, confirmPassword } = await request.json();
  if (typeof password !== 'string' || password !== confirmPassword || password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return NextResponse.json({ error: 'Use uma senha forte e confirme corretamente' }, { status: 400 });
  const invitation = await consumeAdminInvitation(token);
  if (!invitation) return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 400 });
  await prisma.user.update({ where: { id: invitation.userId }, data: { password: await bcrypt.hash(password, 12) } });
  return NextResponse.json({ ok: true, email: invitation.email });
}
