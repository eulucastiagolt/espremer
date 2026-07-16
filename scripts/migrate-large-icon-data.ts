import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { writeCommunityIcon } from '../src/lib/community-icon-storage';

async function migrateShares() {
  const directory = join(process.cwd(), 'src', 'data', 'shares');
  const files = await readdir(directory).catch(() => [] as string[]);
  for (const file of files.filter((item) => item.endsWith('.json'))) {
    const path = join(directory, file);
    const data = JSON.parse(await readFile(path, 'utf8')) as { id: string; svg?: string; [key: string]: unknown };
    if (!data.svg) continue;
    await writeFile(join(directory, `${data.id}.svg`), data.svg, 'utf8');
    const metadata = { ...data };
    delete metadata.svg;
    await writeFile(path, JSON.stringify(metadata, null, 2));
  }
}

async function migrateCommunity() {
  const icons = await prisma.communityIcon.findMany({ where: { svg: { not: null } } });
  for (const icon of icons) {
    if (!icon.svg) continue;
    const filePath = await writeCommunityIcon(icon.id, icon.svg);
    await prisma.communityIcon.update({ where: { id: icon.id }, data: { svg: null, filePath } });
  }
}

async function main() {
  await mkdir(join(process.cwd(), 'src', 'data', 'community-icons'), { recursive: true });
  await migrateShares();
  await migrateCommunity();
  console.log('Large icon payload migration completed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
