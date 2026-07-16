import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { hasUserPermission } from '@/lib/admin-permissions';
import {
  getRemovalRequest,
  listRemovalRequests,
  removeShareFile,
  updateRemovalRequest,
} from '@/lib/removal-requests';
import { emailLayout, escapeHtml, sendTransactionalEmail } from '@/lib/email';
import { readShare } from '@/lib/share-storage';

async function requireAdmin() {
  return hasUserPermission(await getCurrentAdmin(), 'removals.manage');
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const requests = await listRemovalRequests();
  return NextResponse.json(await Promise.all(requests.map(async (request) => ({
    ...request,
    svg: await readShare(request.shareId).then((share) => share.svg).catch(() => ''),
  }))));
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const removalRequest = await getRemovalRequest(id);
  if (!removalRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (removalRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
  }

  try {
    if (status === 'approved') await removeShareFile(removalRequest.shareId);
  } catch (error) {
    const isMissingFile = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (!isMissingFile) throw error;
  }

  const updated = await updateRemovalRequest({
    ...removalRequest,
    status,
    processedAt: new Date().toISOString(),
  });
  const statusLabel = status === 'approved' ? 'aprovada' : 'recusada';
  const actionText = status === 'approved'
    ? 'O ícone foi removido da plataforma após análise administrativa.'
    : 'Após análise, a solicitação não foi aprovada e o ícone continua disponível.';

  try {
    await sendTransactionalEmail({
      to: updated.email,
      subject: `[Espremer] Solicitação de remoção ${statusLabel}`,
      html: emailLayout('Atualização da solicitação de remoção', `
        <p>Sua solicitação foi <strong>${statusLabel}</strong>.</p>
        <p>${actionText}</p>
        <p><strong>Ícone:</strong> ${escapeHtml(updated.shareName)}<br /><strong>ID:</strong> ${escapeHtml(updated.shareId)}</p>
      `),
    });
  } catch (error) {
    console.error('Removal decision email error:', error);
  }

  return NextResponse.json(updated);
}
