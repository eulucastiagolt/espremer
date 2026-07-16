import { NextRequest, NextResponse } from 'next/server';
import { verifyHcaptcha } from '@/lib/hcaptcha';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';

const SUBJECT_MAP: Record<string, string> = {
  duvida: 'Dúvida',
  sugestao: 'Sugestão',
  problema: 'Reportar problema',
  outro: 'Outro',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, captchaToken } = body as {
      name: string;
      email: string;
      subject: string;
      message: string;
      captchaToken: string;
    };

    if (!name || !email || !message || !captchaToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify hCaptcha
    const isValidCaptcha = await verifyHcaptcha(captchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json({ error: 'Invalid captcha' }, { status: 400 });
    }

    const subjectLabel = SUBJECT_MAP[subject] || subject;

    const emailResults = await Promise.allSettled([
      sendTransactionalEmail({
      to: process.env.CONTACT_EMAIL || 'contato@ltcode.com.br',
      replyTo: email,
      subject: `[Espremer] ${subjectLabel} - ${name}`,
      html: emailLayout('Nova mensagem de contato', `
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(subjectLabel)}</p>
        <p><strong>Mensagem:</strong></p>
        <p style="background: #f4f4f5; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</p>
      `),
      }),
      sendTransactionalEmail({
        to: email,
        subject: '[Espremer] Recebemos sua mensagem',
        html: emailLayout('Mensagem recebida', `
          <p>Olá, ${escapeHtml(name)}. Recebemos sua mensagem e entraremos em contato assim que possível.</p>
          <p><strong>Assunto:</strong> ${escapeHtml(subjectLabel)}</p>
        `),
      }),
    ]);
    for (const result of emailResults) {
      if (result.status === 'rejected') console.error('Contact notification error:', result.reason);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
