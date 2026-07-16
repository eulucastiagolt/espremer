import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { getPlatformSettings } from '@/lib/platform-settings';
import { prisma } from '@/lib/prisma';
import { readCommunityIcon } from '@/lib/community-icon-storage';
import { readShare, writeShare } from '@/lib/share-storage';

const SHARES_DIR = join(process.cwd(), 'src', 'data', 'shares');

interface ShareData {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
  expiresAt: string | null; // null = never (public)
  isPublic: boolean;
}

interface PublicCommunityIcon {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
  isPublic: true;
}

/** Garante que o diretório de shares existe. */
async function ensureDir(): Promise<void> {
  try {
    await readdir(SHARES_DIR);
  } catch {
    const { mkdir } = await import('fs/promises');
    await mkdir(SHARES_DIR, { recursive: true });
  }
}

/** Limpa shares expirados. */
async function cleanupExpired(): Promise<void> {
  try {
    const files = await readdir(SHARES_DIR);
    const now = Date.now();
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await readFile(join(SHARES_DIR, file), 'utf-8');
        const data = JSON.parse(raw) as ShareData;
        if (data.expiresAt && new Date(data.expiresAt).getTime() < now) {
          await unlink(join(SHARES_DIR, file));
          await unlink(join(SHARES_DIR, file.replace(/\.json$/, '.svg'))).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

/** POST — Criar novo share */
export async function POST(request: NextRequest) {
  try {
    await ensureDir();
    await cleanupExpired();

    const body = await request.json();
    const platformSettings = await getPlatformSettings();
    const { svg, name, duration: requestedDuration } = body as {
      svg: string;
      name: string;
      duration: string; // '1h' | '24h' | '7d' | '30d' | 'never'
    };
    const duration = requestedDuration || platformSettings.defaultShareDuration;

    if (!svg || typeof svg !== 'string') {
      return NextResponse.json({ error: 'SVG data required' }, { status: 400 });
    }
    if (duration === 'never' && !platformSettings.allowPublicSharing) {
      return NextResponse.json({ error: 'Compartilhamentos públicos estão desativados' }, { status: 403 });
    }

    // Check for duplicate SVG
    const files = await readdir(SHARES_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await readFile(join(SHARES_DIR, file), 'utf-8');
        const existing = JSON.parse(raw) as ShareData;
        if (existing.svg === svg) {
          // Check if not expired
          if (!existing.expiresAt || new Date(existing.expiresAt).getTime() > Date.now()) {
            return NextResponse.json({
              id: existing.id,
              url: `/share/${existing.id}`,
              expiresAt: existing.expiresAt,
              isPublic: existing.isPublic,
              duplicate: true,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    const id = randomBytes(8).toString('hex');
    const now = new Date();
    let expiresAt: string | null = null;
    let isPublic = false;

    switch (duration) {
      case '1h':
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'never':
        expiresAt = null;
        isPublic = true;
        break;
      default:
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    const shareData: ShareData = {
      id,
      svg,
      name: name || 'icon.svg',
      createdAt: now.toISOString(),
      expiresAt,
      isPublic,
    };

    await writeShare(shareData, svg);

    return NextResponse.json({
      id,
      url: `/share/${id}`,
      expiresAt,
      isPublic,
      duplicate: false,
    });
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET — Buscar share por ID ou listar ícones públicos */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    await ensureDir();
    await cleanupExpired();

    // Listar ícones públicos (sem ID)
    if (!id) {
      const files = await readdir(SHARES_DIR);
      const publicIcons: Array<{ id: string; svg: string; name: string; createdAt: string }> = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await readFile(join(SHARES_DIR, file), 'utf-8');
          const data = JSON.parse(raw) as ShareData;
          if (data.isPublic) {
            publicIcons.push({
              id: data.id,
              svg: data.svg,
              name: data.name,
              createdAt: data.createdAt,
            });
          }
        } catch {
          /* ignore */
        }
      }

      const approvedCommunityIcons = await prisma.communityIcon.findMany({
        where: { status: 'approved' },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const communityIcons: PublicCommunityIcon[] = (await Promise.all(approvedCommunityIcons.map(async (icon) => {
        try { return { id: icon.id, svg: await readCommunityIcon(icon.id), name: icon.name, createdAt: icon.createdAt.toISOString(), isPublic: true as const }; } catch { return null; }
      }))).filter((icon): icon is PublicCommunityIcon => Boolean(icon));

      return NextResponse.json({ icons: [...publicIcons, ...communityIcons], total: publicIcons.length + communityIcons.length }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Buscar share por ID
    let data: ShareData | PublicCommunityIcon;
    try {
      data = await readShare(id);
    } catch {
      const communityIcon = await prisma.communityIcon.findFirst({ where: { id, status: 'approved' } });
      if (!communityIcon) return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      try {
        data = { id: communityIcon.id, svg: await readCommunityIcon(communityIcon.id), name: communityIcon.name, createdAt: communityIcon.createdAt.toISOString(), isPublic: true };
      } catch {
        return NextResponse.json({ error: 'Icon file not found' }, { status: 404 });
      }
    }

    // Verifica expiração
    if ('expiresAt' in data && data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      await unlink(join(SHARES_DIR, `${id}.json`)).catch(() => {});
      await unlink(join(SHARES_DIR, `${id}.svg`)).catch(() => {});
      return NextResponse.json({ error: 'Share expired' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }
}

/** DELETE is intentionally disabled: removals require administrative approval. */
export async function DELETE() {
  return NextResponse.json({ error: 'Removals require administrative approval' }, { status: 405 });
}
