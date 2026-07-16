import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = normalizedEmail ? await prisma.user.findUnique({ where: { email: normalizedEmail } }) : null;

  if (user?.role === 'community' && !user.emailVerified && user.isActive) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    const token = randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
    const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/community/verify?token=${token}`;
    try {
      await sendTransactionalEmail({ to: user.email, subject: '[Espremer] Novo link de confirmação', html: emailLayout('Confirme seu e-mail', `<p>Olá, ${escapeHtml(user.name || user.email)}. Clique no link abaixo para confirmar sua conta:</p><p><a href="${url}">Confirmar e-mail</a></p><p>Este link expira em 24 horas.</p>`) });
    } catch (error) { console.error('Community verification resend error:', error); }
  }

  return NextResponse.json({ ok: true, message: 'Se a conta existir e ainda não estiver confirmada, um novo link será enviado.' });
}
