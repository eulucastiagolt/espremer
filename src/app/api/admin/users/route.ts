import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { getCurrentAdmin, isSuperAdmin, ADMIN_PERMISSIONS } from '@/lib/admin-auth';
import { getUserPermissions, hasUserPermission, setUserPermissions } from '@/lib/admin-permissions';
import { prisma } from '@/lib/prisma';
import { createAdminInvitation } from '@/lib/admin-invitations';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';
import { getPublicOrigin } from '@/lib/public-url';

const strongPassword = (value: string) => value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
const canManageUsers = async (user: { id: string; role: string } | null) => Boolean(user && (isSuperAdmin(user) || await hasUserPermission(user, 'admins.manage')));

export async function GET() {
  const current = await getCurrentAdmin();
  if (!(await canManageUsers(current))) return NextResponse.json({ error: 'Você não tem permissão para gerenciar usuários' }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(await Promise.all(users.map(async (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, permissions: await getUserPermissions(user.id, user.role) }))));
}

export async function POST(request: NextRequest) {
  const current = await getCurrentAdmin();
  if (!(await canManageUsers(current))) return NextResponse.json({ error: 'Você não tem permissão para criar usuários' }, { status: 403 });
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const generatePassword = Boolean(body.generatePassword);
  const role = ['admin', 'super_admin', 'community'].includes(body.role) ? body.role : 'admin';
  const password = typeof body.password === 'string' ? body.password : '';
  const generatedPassword = generatePassword ? `Tmp!${randomBytes(12).toString('hex')}A9` : password;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !strongPassword(generatedPassword)) return NextResponse.json({ error: 'Nome, e-mail e senha forte são obrigatórios' }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
   const user = await prisma.user.create({ data: { name, email, password: await bcrypt.hash(generatedPassword, 12), role, isActive: true } });
  const permissions = await setUserPermissions(user.id, Array.isArray(body.permissions) ? body.permissions : []);
  if (generatePassword) {
    const token = await createAdminInvitation({ userId: user.id, email: user.email });
    const activationUrl = `${getPublicOrigin(request)}/admin/activate?token=${token}`;
    try { await sendTransactionalEmail({ to: email, subject: '[Espremer] Convite para o painel administrativo', html: emailLayout('Seu acesso administrativo', `<p>Olá, ${escapeHtml(name)}. Seu acesso foi criado.</p><p><a href="${activationUrl}">Clique aqui para definir sua senha e acessar o painel</a>. Este link expira em 24 horas.</p>`) }); } catch (error) { console.error('Admin invitation email error:', error); }
  }
  return NextResponse.json({ id: user.id, name, email, role: user.role, isActive: true, permissions }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const current = await getCurrentAdmin();
  if (!(await canManageUsers(current))) return NextResponse.json({ error: 'Você não tem permissão para alterar usuários' }, { status: 403 });
  const body = await request.json();
  const user = await prisma.user.findUnique({ where: { id: body.id } });
  if (!user) return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 });
  if (user.role === 'super_admin' && !isSuperAdmin(current)) return NextResponse.json({ error: 'Somente o super administrador pode alterar este usuário' }, { status: 403 });
  if (user.role === 'super_admin' && body.role !== 'super_admin') return NextResponse.json({ error: 'O super administrador não pode ser rebaixado' }, { status: 400 });
  const role = ['admin', 'super_admin', 'community'].includes(body.role) ? body.role : 'admin';
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role, isActive: Boolean(body.isActive), name: typeof body.name === 'string' ? body.name.trim() : user.name } });
  const permissions = role === 'super_admin' ? [...ADMIN_PERMISSIONS] : await setUserPermissions(user.id, Array.isArray(body.permissions) ? body.permissions : []);
  return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive, permissions });
}
