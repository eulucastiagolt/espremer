import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { hasUserPermission } from '@/lib/admin-permissions';
import { removeShare } from '@/lib/share-storage';

const SHARES_DIR = join(process.cwd(), 'src', 'data', 'shares');

interface ShareData {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  isPublic: boolean;
}

async function requireAdmin() {
  return hasUserPermission(await getCurrentAdmin(), 'shares.manage');
}

async function listShares() {
  const files = await readdir(SHARES_DIR).catch(() => [] as string[]);
  const shares: ShareData[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      shares.push(JSON.parse(await readFile(join(SHARES_DIR, file), 'utf8')) as ShareData);
    } catch {
      // Ignore invalid share files.
    }
  }
  return shares.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await listShares(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, isPublic } = await request.json();
  if (!id || typeof isPublic !== 'boolean') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const filePath = join(SHARES_DIR, `${id}.json`);
  try {
    const share = JSON.parse(await readFile(filePath, 'utf8')) as ShareData;
    share.isPublic = isPublic;
    await writeFile(filePath, JSON.stringify(share, null, 2));
    return NextResponse.json(share);
  } catch {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  try {
    await removeShare(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }
}
