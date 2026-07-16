import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

async function getUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const action = body.action as string;

  if (action === 'profile') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Nome e e-mail válidos são obrigatórios' }, { status: 400 });
    }

    if (email !== user.email) {
      const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return NextResponse.json({ error: 'Senha atual inválida' }, { status: 400 });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data: { name, email } });
    return NextResponse.json({ name: updated.name, email: updated.email, emailChanged: email !== user.email });
  }

  if (action === 'password') {
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    const strong = newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: 'Senha atual inválida' }, { status: 400 });
    }
    if (!strong) return NextResponse.json({ error: 'A nova senha não atende aos requisitos de segurança' }, { status: 400 });
    if (newPassword !== confirmPassword) return NextResponse.json({ error: 'As senhas não coincidem' }, { status: 400 });

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
