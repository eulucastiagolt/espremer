import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Espremer <noreply@ltcode.com.br>';

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) throw new Error(error.message);
}

export function emailLayout(title: string, content: string) {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
    <h2 style="border-bottom: 1px solid #e4e4e7; padding-bottom: 12px;">${title}</h2>
    ${content}
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 12px;" />
    <p style="color: #71717a; font-size: 12px;">Este é um e-mail automático do Espremer.</p>
  </div>`;
}
