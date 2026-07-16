import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';
import { getPublicOrigin } from '@/lib/public-url';

export async function POST(request: NextRequest) {
  const { name, email, password, acceptedPolicies } = await request.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const strong = typeof password === 'string' && password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !strong || !acceptedPolicies) return NextResponse.json({ error: 'Preencha os dados e aceite as políticas com uma senha forte' }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
  const user = await prisma.user.create({ data: { name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12), role: 'community', isActive: true } });
  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  const verificationUrl = `${getPublicOrigin(request)}/community/verify?token=${token}`;
  try { await sendTransactionalEmail({ to: user.email, subject: '[Espremer] Confirme seu e-mail', html: emailLayout('Confirme seu e-mail', `<p>Olá, ${escapeHtml(user.name || user.email)}. Sua conta foi criada.</p><p><a href="${verificationUrl}">Clique aqui para confirmar seu e-mail</a> e liberar o acesso à comunidade. Este link expira em 24 horas.</p>`) }); } catch (error) { console.error('Community verification email error:', error); }
  return NextResponse.json({ ok: true, requiresVerification: true });
}
