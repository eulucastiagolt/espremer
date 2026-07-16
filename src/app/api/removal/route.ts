import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyHcaptcha } from '@/lib/hcaptcha';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';
import { createRemovalRequest, listRemovalRequests } from '@/lib/removal-requests';
const SHARES_DIR = join(process.cwd(), 'src', 'data', 'shares');

interface ShareData {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  isPublic: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareId, reason, email, captchaToken } = body as {
      shareId: string;
      reason: string;
      email: string;
      captchaToken: string;
    };

    if (!shareId || !reason || !email || !captchaToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid contact email is required' }, { status: 400 });
    }

    // Verify hCaptcha
    const isValidCaptcha = await verifyHcaptcha(captchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json({ error: 'Invalid captcha' }, { status: 400 });
    }

    // Only inspect the share. Deletion happens after admin approval.
    let shareData: ShareData | null = null;
    try {
      const raw = await readFile(join(SHARES_DIR, `${shareId}.json`), 'utf-8');
      shareData = JSON.parse(raw) as ShareData;
    } catch {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const existingRequests = await listRemovalRequests();
    if (existingRequests.some((item) => item.shareId === shareId && item.status === 'pending')) {
      return NextResponse.json({ error: 'A removal request is already under review' }, { status: 409 });
    }

    const removalRequest = await createRemovalRequest({
      shareId,
      shareName: shareData.name,
      reason: reason.trim(),
      email: normalizedEmail,
    });

    const emailResults = await Promise.allSettled([
      sendTransactionalEmail({
        to: process.env.CONTACT_EMAIL || 'contato@ltcode.com.br',
        replyTo: normalizedEmail,
        subject: `[Espremer] Solicitação de remoção - ${shareId}`,
        html: emailLayout('Nova solicitação de remoção', `
          <p>Uma solicitação aguarda análise no painel administrativo.</p>
          <p><strong>Ícone:</strong> ${escapeHtml(shareData.name)}<br /><strong>ID:</strong> ${escapeHtml(shareId)}<br /><strong>Solicitante:</strong> ${escapeHtml(normalizedEmail)}</p>
          <p><strong>Motivo:</strong></p><p style="background: #f4f4f5; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(reason.trim())}</p>
        `),
      }),
      sendTransactionalEmail({
        to: normalizedEmail,
        subject: '[Espremer] Solicitação recebida e em análise',
        html: emailLayout('Solicitação recebida', `
          <p>Recebemos sua solicitação de remoção. Ela será analisada pela equipe administrativa antes de qualquer alteração.</p>
          <p><strong>Ícone:</strong> ${escapeHtml(shareData.name)}<br /><strong>ID:</strong> ${escapeHtml(shareId)}</p>
          <p>Você receberá uma nova mensagem quando a decisão for tomada.</p>
        `),
      }),
    ]);
    for (const result of emailResults) {
      if (result.status === 'rejected') console.error('Removal notification error:', result.reason);
    }

    return NextResponse.json({ ok: true, requestId: removalRequest.id });
  } catch (error) {
    console.error('Removal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
