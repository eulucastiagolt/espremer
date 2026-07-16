import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Check if setup is still allowed
    const existingUser = await prisma.user.findFirst();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 403 },
      );
    }

    const { email, password, confirmPassword, fullName } = await request.json();

    if (!email || !password || !confirmPassword || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const isStrongPassword =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!isStrongPassword) {
      return NextResponse.json(
        { error: 'Password must contain 8 characters, uppercase, lowercase, number and symbol' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: fullName,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
      },
    });

    try {
      await sendTransactionalEmail({
        to: user.email,
        subject: '[Espremer] Conta de administrador criada',
        html: emailLayout('Conta criada com sucesso', `
          <p>Olá, ${escapeHtml(user.name || user.email)}. Sua conta de administrador foi criada com sucesso.</p>
          <p>Você já pode acessar o painel administrativo usando este endereço de e-mail.</p>
        `),
      });
    } catch (error) {
      console.error('Admin account email error:', error);
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    console.error('Setup create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
