import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { hasUserPermission } from '@/lib/admin-permissions';
import { prisma } from '@/lib/prisma';

const ICONS_DIR = join(process.cwd(), 'src', 'data', 'icons');
const MANIFEST_PATH = join(ICONS_DIR, 'manifest.json');
const PUBLIC_ICONS_DIR = join(process.cwd(), 'public', 'icons');
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type IconSet = {
  name: string;
  prefix: string;
  license: string;
  height: number;
  category: string;
  total: number;
  icons: Record<string, { categories?: string[] }>;
};

type Manifest = { version: string; lastUpdated: string; sets: Record<string, IconSet> };

async function requireAdmin() {
  return hasUserPermission(await getCurrentAdmin(), 'icons.manage');
}

async function readManifest() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Manifest;
  const entries = await readdir(ICONS_DIR, { withFileTypes: true });
  let changed = false;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!manifest.sets[entry.name]) {
      manifest.sets[entry.name] = { name: entry.name, prefix: entry.name, license: 'Unknown', height: 24, category: 'Custom', total: 0, icons: {} };
      changed = true;
    }
    const files = await readdir(join(ICONS_DIR, entry.name));
    for (const file of files) {
      if (file.endsWith('.svg') && !manifest.sets[entry.name].icons[file.slice(0, -4)]) {
        manifest.sets[entry.name].icons[file.slice(0, -4)] = {};
        changed = true;
      }
    }
    const total = Object.keys(manifest.sets[entry.name].icons).length;
    if (manifest.sets[entry.name].total !== total) { manifest.sets[entry.name].total = total; changed = true; }
  }
  if (changed) await saveManifest(manifest);
  return manifest;
}

async function saveManifest(manifest: Manifest) {
  manifest.lastUpdated = new Date().toISOString();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

function validSvg(svg: unknown): svg is string {
  return typeof svg === 'string' && /<svg[\s>]/i.test(svg) && !/<script|on[a-z]+\s*=/i.test(svg);
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const family = new URL(request.url).searchParams.get('family');
  const manifest = await readManifest();
  if (!family) {
    return NextResponse.json(Object.entries(manifest.sets).map(([id, set]) => ({ id, name: set.name, prefix: set.prefix, license: set.license, height: set.height, category: set.category, total: Object.keys(set.icons).length })));
  }
  const set = manifest.sets[family];
  if (!set) return NextResponse.json({ error: 'Family not found' }, { status: 404 });
  return NextResponse.json({ family: { id: family, ...set }, icons: Object.keys(set.icons), updatedAt: manifest.lastUpdated });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const manifest = await readManifest();

  if (body.action === 'create-family') {
    const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : '';
    if (!SAFE_ID.test(id) || manifest.sets[id]) return NextResponse.json({ error: 'Identificador inválido ou já existente' }, { status: 400 });
    const set: IconSet = { name: String(body.name || id).trim(), prefix: String(body.prefix || id).trim(), license: String(body.license || 'Custom'), height: Number(body.height) || 24, category: String(body.category || 'Custom'), total: 0, icons: {} };
    await mkdir(join(ICONS_DIR, id), { recursive: true });
    await mkdir(join(PUBLIC_ICONS_DIR, id), { recursive: true });
    manifest.sets[id] = set;
    await prisma.iconFamily.create({ data: { id, name: set.name, prefix: set.prefix, license: set.license, height: set.height, category: set.category } });
    await saveManifest(manifest);
    revalidateTag('icon-catalog', 'max');
    return NextResponse.json({ id, ...set }, { status: 201 });
  }

  if (body.action === 'add-icon') {
    const family = typeof body.family === 'string' ? body.family : '';
    const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : '';
    const set = manifest.sets[family];
    if (!set || !SAFE_ID.test(name) || !validSvg(body.svg)) return NextResponse.json({ error: 'Família, nome e SVG válido são obrigatórios' }, { status: 400 });
    await writeFile(join(ICONS_DIR, family, `${name}.svg`), body.svg);
    await mkdir(join(PUBLIC_ICONS_DIR, family), { recursive: true });
    await writeFile(join(PUBLIC_ICONS_DIR, family, `${name}.svg`), body.svg);
    set.icons[name] = { categories: Array.isArray(body.categories) ? body.categories.filter((item: unknown) => typeof item === 'string') : [] };
    set.total = Object.keys(set.icons).length;
    await prisma.iconAsset.upsert({ where: { familyId_name: { familyId: family, name } }, update: { filePath: `icons/${family}/${name}.svg`, hash: createHash('sha256').update(body.svg).digest('hex'), categories: set.icons[name].categories || [], isActive: true }, create: { familyId: family, name, filePath: `icons/${family}/${name}.svg`, hash: createHash('sha256').update(body.svg).digest('hex'), categories: set.icons[name].categories || [] } });
    await saveManifest(manifest);
    revalidateTag('icon-catalog', 'max');
    return NextResponse.json({ name, family }, { status: 201 });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const family = params.get('family') || '';
  const icon = params.get('icon');
  const manifest = await readManifest();
  if (!manifest.sets[family]) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  if (icon) {
    if (!SAFE_ID.test(icon) || !manifest.sets[family].icons[icon]) return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
    await rm(join(ICONS_DIR, family, `${icon}.svg`), { force: true });
    await rm(join(PUBLIC_ICONS_DIR, family, `${icon}.svg`), { force: true });
    await prisma.iconAsset.deleteMany({ where: { familyId: family, name: icon } });
    delete manifest.sets[family].icons[icon];
    manifest.sets[family].total = Object.keys(manifest.sets[family].icons).length;
  } else {
    await rm(join(ICONS_DIR, family), { recursive: true, force: true });
    await rm(join(PUBLIC_ICONS_DIR, family), { recursive: true, force: true });
    await prisma.iconFamily.delete({ where: { id: family } });
    delete manifest.sets[family];
  }
  await saveManifest(manifest);
  revalidateTag('icon-catalog', 'max');
  return NextResponse.json({ ok: true });
}
