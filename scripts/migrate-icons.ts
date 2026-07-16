/**
 * Script para migrar ícones do Iconify API para armazenamento local.
 *
 * Uso:
 *   npx tsx scripts/migrate-icons.ts
 *
 * Este script:
 * 1. Baixa a lista de todos os ícones dos conjuntos curados
 * 2. Salva os metadados no manifest.json
 * 3. Baixa os SVGs de cada ícone e salva localmente
 *
 * O script é idempotente - pode ser executado múltiplas vezes sem duplicar dados.
 */

import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';

const ICONIFY_API = 'https://api.iconify.design';
const ICONS_DIR = join(import.meta.dirname, '..', 'src', 'data', 'icons');
const MANIFEST_PATH = join(ICONS_DIR, 'manifest.json');

interface IconSet {
  prefix: string;
  name: string;
  license: string;
  height: number;
  category: string;
}

const SETS_TO_MIGRATE: IconSet[] = [
  { prefix: 'lucide', name: 'Lucide', license: 'ISC', height: 24, category: 'UI 24px' },
  { prefix: 'tabler', name: 'Tabler Icons', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'heroicons', name: 'Heroicons', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'ri', name: 'Remix Icon', license: 'Apache 2.0', height: 24, category: 'UI 24px' },
  { prefix: 'bx', name: 'Boxicons', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'bi', name: 'Bootstrap Icons', license: 'MIT', height: 16, category: 'UI' },
  { prefix: 'iconoir', name: 'Iconoir', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'ph', name: 'Phosphor Icons', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'fluent', name: 'Fluent UI', license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'carbon', name: 'Carbon Icons', license: 'Apache 2.0', height: 32, category: 'UI' },
  { prefix: 'mynaui', name: 'Myna UI', license: 'MIT', height: 24, category: 'UI 24px' },
];

interface CollectionResponse {
  prefix: string;
  total: number;
  title: string;
  categories?: Record<string, string[]>;
  uncategorized?: string[];
  aliases?: Record<string, string>;
  icons: Record<string, { body: string; width?: number; height?: number }>;
}

interface Manifest {
  version: string;
  lastUpdated: string;
  sets: Record<string, {
    name: string;
    prefix: string;
    license: string;
    height: number;
    category: string;
    total: number;
    icons: Record<string, { categories?: string[] }>;
  }>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

async function fetchSVG(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return res.text();
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await stat(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function migrateSet(set: IconSet): Promise<number> {
  console.log(`\n📦 Migrating ${set.name} (${set.prefix})...`);

  // Fetch full collection with SVGs
  const url = `${ICONIFY_API}/collection?prefix=${set.prefix}`;
  console.log(`  Fetching collection from ${url}`);

  const collection = await fetchJSON<CollectionResponse>(url);

  const setDir = join(ICONS_DIR, set.prefix);
  await ensureDir(setDir);

  // Read existing manifest
  const manifestData = await readFile(MANIFEST_PATH, 'utf-8');
  const manifest: Manifest = JSON.parse(manifestData);

  // Initialize set in manifest if not exists
  if (!manifest.sets[set.prefix]) {
    manifest.sets[set.prefix] = {
      name: set.name,
      prefix: set.prefix,
      license: set.license,
      height: set.height,
      category: set.category,
      total: 0,
      icons: {},
    };
  }

  const setManifest = manifest.sets[set.prefix];
  let savedCount = 0;
  let skippedCount = 0;

  // Process icons in batches
  const iconNames = [
    ...Object.keys(collection.icons || {}),
    ...Object.values(collection.categories || {}).flat(),
    ...(collection.uncategorized || []),
  ];

  // Deduplicate
  const uniqueNames = [...new Set(iconNames)];

  console.log(`  Found ${uniqueNames.length} icons to process`);

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + BATCH_SIZE);

    // Fetch SVGs in batch
    const batchUrl = `${ICONIFY_API}/${set.prefix}.json?icons=${batch.join(',')}`;
    try {
      const batchData = await fetchJSON<{ icons: Record<string, { body: string; width?: number; height?: number }> }>(batchUrl);

      for (const iconName of batch) {
        const iconData = batchData.icons[iconName];
        if (!iconData) continue;

        // Check if already exists
        const filePath = join(setDir, `${iconName}.svg`);
        try {
          await stat(filePath);
          skippedCount++;
          continue;
        } catch {
          // File doesn't exist, continue
        }

        // Build SVG
        const w = iconData.width || set.height;
        const h = iconData.height || set.height;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${iconData.body}</svg>`;

        await writeFile(filePath, svg, 'utf-8');

        // Determine categories
        const categories: string[] = [];
        if (collection.categories) {
          for (const [catName, catIcons] of Object.entries(collection.categories)) {
            if (catIcons.includes(iconName)) {
              categories.push(catName);
            }
          }
        }

        setManifest.icons[iconName] = {
          categories: categories.length > 0 ? categories : undefined,
        };

        savedCount++;
      }

      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, uniqueNames.length)}/${uniqueNames.length}`);

      // Rate limit: wait 100ms between batches
      if (i + BATCH_SIZE < uniqueNames.length) {
        await delay(100);
      }
    } catch (error) {
      console.error(`  Error fetching batch:`, error);
      // Continue with next batch
    }
  }

  setManifest.total = Object.keys(setManifest.icons).length;

  // Save updated manifest
  manifest.lastUpdated = new Date().toISOString();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`  ✅ Saved: ${savedCount} icons, Skipped: ${skippedCount} (already exist)`);
  return savedCount;
}

async function main() {
  console.log('🚀 Starting icon migration from Iconify to local storage...\n');

  const requested = process.argv.slice(2);
  const setsToMigrate = requested.length > 0
    ? SETS_TO_MIGRATE.filter((set) => requested.includes(set.prefix))
    : SETS_TO_MIGRATE;

  let totalSaved = 0;

  for (const set of setsToMigrate) {
    try {
      const saved = await migrateSet(set);
      totalSaved += saved;
    } catch (error) {
      console.error(`❌ Error migrating ${set.name}:`, error);
    }
  }

  console.log(`\n✨ Migration complete! Total icons saved: ${totalSaved}`);
  console.log(`📁 Icons stored in: ${ICONS_DIR}`);
  console.log(`📄 Manifest: ${MANIFEST_PATH}`);
}

main().catch(console.error);
