import { getCurrentAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { writeCommunityIcon, removeCommunityIcon } from '@/lib/community-icon-storage';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Faça login para acessar a comunidade' }, { status: 401 });
  if (user.role !== 'community') return NextResponse.json({ error: 'Esta sessão não é uma conta da comunidade. Crie ou acesse uma conta em /community/register.' }, { status: 403 });
  return NextResponse.json({ icons: await prisma.communityIcon.findMany({ where: { submittedBy: user.id }, orderBy: { createdAt: 'desc' } }), account: { emailVerified: Boolean(user.emailVerified) } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Faça login para acessar a comunidade' }, { status: 401 });
  if (user.role !== 'community') return NextResponse.json({ error: 'Esta sessão não é uma conta da comunidade. Crie ou acesse uma conta em /community/register.' }, { status: 403 });
  const { name, svg, categories, acceptedPolicies } = await request.json();
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanSvg = typeof svg === 'string' ? svg.trim().replace(/^\uFEFF/, '') : '';
  if (!cleanName) return NextResponse.json({ error: 'Informe o nome do ícone' }, { status: 400 });
  if (!/<svg\b[^>]*>/i.test(cleanSvg) || !/<\/svg\s*>/i.test(cleanSvg) || /<script|on[a-z]+\s*=/i.test(cleanSvg)) return NextResponse.json({ error: 'Cole um SVG válido, contendo as tags <svg> e </svg>' }, { status: 400 });
  if (acceptedPolicies !== true) return NextResponse.json({ error: 'Aceite as políticas da plataforma antes de enviar' }, { status: 400 });
  const iconId = randomUUID();
  const filePath = await writeCommunityIcon(iconId, cleanSvg);
  const icon = await prisma.communityIcon.create({ data: { id: iconId, name: cleanName, svg: null, filePath, categories: Array.isArray(categories) ? categories.filter((item: unknown) => typeof item === 'string') : [], status: 'pending', submittedBy: user.id } });
  const notifications = await Promise.allSettled([
    sendTransactionalEmail({ to: user.email, subject: '[Espremer] Ícone recebido para análise', html: emailLayout('Ícone recebido', `<p>Recebemos o ícone <strong>${escapeHtml(icon.name)}</strong>. Ele ficará em análise antes de ser publicado na comunidade.</p>`) }),
    sendTransactionalEmail({ to: process.env.CONTACT_EMAIL || 'contato@ltcode.com.br', replyTo: user.email, subject: `[Espremer] Novo ícone da comunidade - ${icon.name}`, html: emailLayout('Novo ícone aguardando moderação', `<p><strong>Nome:</strong> ${escapeHtml(icon.name)}<br /><strong>Autor:</strong> ${escapeHtml(user.email)}</p><p>Acesse o painel de comunidade para revisar este envio.</p>`) }),
  ]);
  for (const result of notifications) if (result.status === 'rejected') console.error('Community submission email error:', result.reason);
  return NextResponse.json(icon, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Faça login para acessar a comunidade' }, { status: 401 });
  if (user.role !== 'community') return NextResponse.json({ error: 'Esta sessão não é uma conta da comunidade.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  const icon = id ? await prisma.communityIcon.findFirst({ where: { id, submittedBy: user.id } }) : null;
  if (!icon) return NextResponse.json({ error: 'Ícone não encontrado' }, { status: 404 });
  await prisma.communityIcon.delete({ where: { id: icon.id } });
  await removeCommunityIcon(icon.id);
  return NextResponse.json({ ok: true });
}
