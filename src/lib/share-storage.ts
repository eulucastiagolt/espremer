import { mkdir, readFile, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

export const SHARES_DIR = join(process.cwd(), 'src', 'data', 'shares');
export type ShareMeta = { id: string; name: string; createdAt: string; expiresAt: string | null; isPublic: boolean; svg?: string };

export async function writeShare(meta: ShareMeta, svg: string) {
  await mkdir(SHARES_DIR, { recursive: true });
  const metadata = { ...meta };
  delete metadata.svg;
  await writeFile(join(SHARES_DIR, `${meta.id}.svg`), svg, 'utf8');
  await writeFile(join(SHARES_DIR, `${meta.id}.json`), JSON.stringify(metadata, null, 2));
}

export async function readShare(id: string) {
  const meta = JSON.parse(await readFile(join(SHARES_DIR, `${id}.json`), 'utf8')) as ShareMeta;
  const svg = meta.svg || await readFile(join(SHARES_DIR, `${id}.svg`), 'utf8');
  return { ...meta, svg };
}

export async function listShareMetadata() {
  const files = await readdir(SHARES_DIR).catch(() => [] as string[]);
  const result: ShareMeta[] = [];
  for (const file of files.filter((item) => item.endsWith('.json'))) {
    try { result.push(JSON.parse(await readFile(join(SHARES_DIR, file), 'utf8')) as ShareMeta); } catch { /* ignore */ }
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function removeShare(id: string) {
  await unlink(join(SHARES_DIR, `${id}.json`)).catch(() => {});
  await unlink(join(SHARES_DIR, `${id}.svg`)).catch(() => {});
}
