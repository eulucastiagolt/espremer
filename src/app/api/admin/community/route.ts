import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { hasUserPermission } from '@/lib/admin-permissions';
import { readCommunityIcon, writeCommunityIcon } from '@/lib/community-icon-storage';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';

async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user || !(await hasUserPermission(user, 'community.manage'))) return null;
  return user.id;
}

export async function POST(request: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, svg, categories } = await request.json();
  if (!name?.trim() || typeof svg !== 'string' || !/<svg[\s>]/i.test(svg) || /<script|on[a-z]+\s*=/i.test(svg)) {
    return NextResponse.json({ error: 'Nome e SVG válido são obrigatórios' }, { status: 400 });
  }
  const iconId = randomUUID();
  const filePath = await writeCommunityIcon(iconId, svg);
  const icon = await prisma.communityIcon.create({
    data: { id: iconId, name: name.trim(), svg: null, filePath, categories: Array.isArray(categories) ? categories.filter((item: unknown) => typeof item === 'string') : [], status: 'approved', submittedBy: userId, reviewedBy: userId, reviewedAt: new Date() },
  });
  return NextResponse.json(icon, { status: 201 });
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where = status && status !== 'all' ? { status } : {};

  const icons = await prisma.communityIcon.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const authorIds = [...new Set(icons.map((icon) => icon.submittedBy).filter((id): id is string => Boolean(id)))];
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, email: true, emailVerified: true, role: true } });
  const authorMap = new Map(authors.map((author) => [author.id, author]));
  return NextResponse.json(await Promise.all(icons.map(async (icon) => { const author = icon.submittedBy ? authorMap.get(icon.submittedBy) : undefined; return { ...icon, svg: await readCommunityIcon(icon.id).catch(() => icon.svg || ''), authorEmail: author?.email || null, authorVerified: author?.role !== 'community' || Boolean(author?.emailVerified) }; })));
}

export async function PATCH(request: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, status, reason } = await request.json();

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }
  if (status === 'rejected' && (typeof reason !== 'string' || !reason.trim())) {
    return NextResponse.json({ error: 'O motivo da recusa é obrigatório' }, { status: 400 });
  }

  const existing = await prisma.communityIcon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
  if (status === 'approved' && existing.submittedBy) {
    const author = await prisma.user.findUnique({ where: { id: existing.submittedBy }, select: { role: true, emailVerified: true } });
    if (author?.role === 'community' && !author.emailVerified) return NextResponse.json({ error: 'O autor precisa confirmar o e-mail antes da aprovação' }, { status: 400 });
  }
  const icon = await prisma.communityIcon.update({
    where: { id },
    data: {
      status,
      reviewedBy: userId,
      reviewedAt: new Date(),
      rejectionReason: status === 'rejected' ? reason.trim() : null,
    },
  });

  if (existing.submittedBy) {
    const author = await prisma.user.findUnique({ where: { id: existing.submittedBy }, select: { email: true } });
    if (author) {
      const approved = status === 'approved';
      try {
        await sendTransactionalEmail({
          to: author.email,
          subject: `[Espremer] Ícone ${approved ? 'aprovado' : 'recusado'}`,
          html: emailLayout(`Ícone ${approved ? 'aprovado' : 'recusado'}`, `<p>O ícone <strong>${escapeHtml(icon.name)}</strong> foi ${approved ? 'aprovado e publicado na comunidade' : 'recusado após análise da equipe'}.</p>${!approved ? `<p><strong>Motivo:</strong></p><p style="white-space: pre-wrap;">${escapeHtml(reason.trim())}</p>` : ''}`),
        });
      } catch (error) { console.error('Community decision email error:', error); }
    }
  }

  return NextResponse.json(icon);
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  await prisma.communityIcon.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
