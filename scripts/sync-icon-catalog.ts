import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { prisma } from '../src/lib/prisma';

const SOURCE = join(process.cwd(), 'src', 'data', 'icons');
const TARGET = join(process.cwd(), 'public', 'icons');
const MANIFEST = join(SOURCE, 'manifest.json');

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8')) as { sets: Record<string, { name: string; prefix: string; license: string; height: number; category: string; icons: Record<string, { categories?: string[] }> }> };
  await mkdir(TARGET, { recursive: true });
  let assets = 0;

  for (const [familyId, family] of Object.entries(manifest.sets)) {
    const sourceDir = join(SOURCE, familyId);
    const targetDir = join(TARGET, familyId);
    await mkdir(targetDir, { recursive: true });
    await prisma.iconFamily.upsert({ where: { id: familyId }, update: { name: family.name, prefix: family.prefix, license: family.license, height: family.height, category: family.category }, create: { id: familyId, name: family.name, prefix: family.prefix, license: family.license, height: family.height, category: family.category } });
    const files = await readdir(sourceDir).catch(() => [] as string[]);
    const assetRows: Array<{ familyId: string; name: string; filePath: string; hash: string; categories: string[]; isActive: boolean }> = [];
    for (const file of files.filter((item) => item.endsWith('.svg'))) {
      const source = join(sourceDir, file);
      const target = join(targetDir, file);
      const svg = await readFile(source);
      await writeFile(target, svg);
      const name = file.slice(0, -4);
      assetRows.push({ familyId, name, filePath: relative(join(process.cwd(), 'public'), target), hash: createHash('sha256').update(svg).digest('hex'), categories: family.icons[name]?.categories || [], isActive: true });
      assets++;
    }
    await prisma.iconAsset.deleteMany({ where: { familyId } });
    for (let index = 0; index < assetRows.length; index += 1000) {
      await prisma.iconAsset.createMany({ data: assetRows.slice(index, index + 1000), skipDuplicates: true });
    }
  }
  console.log(`Synchronized ${assets} SVG assets to public/icons and PostgreSQL metadata.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
