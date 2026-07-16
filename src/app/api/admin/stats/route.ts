import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { hasUserPermission } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await hasUserPermission(await getCurrentAdmin(), 'dashboard.view'))) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const files = await readdir(join(process.cwd(), 'src', 'data', 'shares')).catch(() => [] as string[]);
  const shares = await Promise.all(files.filter((file) => file.endsWith('.json')).map(async (file) => {
    try { return JSON.parse(await readFile(join(process.cwd(), 'src', 'data', 'shares', file), 'utf8')) as { isPublic: boolean; createdAt: string }; } catch { return null; }
  }));
  const validShares = shares.filter((share): share is { isPublic: boolean; createdAt: string } => Boolean(share));
  const [pendingReview, approvedIcons] = await Promise.all([
    prisma.communityIcon.count({ where: { status: 'pending' } }),
    prisma.communityIcon.count({ where: { status: 'approved' } }),
  ]);
  const recentLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return NextResponse.json({
    totalShared: validShares.length,
    publicIcons: validShares.filter((share) => share.isPublic).length,
    pendingReview,
    approvedIcons,
    recentShares: validShares.filter((share) => new Date(share.createdAt).getTime() >= recentLimit).length,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
