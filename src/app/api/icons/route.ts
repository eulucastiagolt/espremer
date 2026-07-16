import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, basename } from 'path';

const ICONS_DIR = join(process.cwd(), 'src', 'data', 'icons');
const MANIFEST_PATH = join(ICONS_DIR, 'manifest.json');

interface ManifestSet {
  name: string;
  prefix: string;
  license: string;
  height: number;
  category: string;
  total: number;
  icons: Record<string, { categories?: string[] }>;
}

interface Manifest {
  version: string;
  lastUpdated: string;
  sets: Record<string, ManifestSet>;
}

async function readManifest(): Promise<Manifest> {
  const data = await readFile(MANIFEST_PATH, 'utf-8');
  const manifest = JSON.parse(data) as Manifest;
  let changed = false;
  const entries = await readdir(ICONS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const setId = entry.name;
    if (!manifest.sets[setId]) {
      manifest.sets[setId] = {
        name: setId,
        prefix: setId,
        license: 'Unknown',
        height: 24,
        category: 'Custom',
        total: 0,
        icons: {},
      };
      changed = true;
    }

    const files = await readdir(join(ICONS_DIR, setId));
    for (const file of files) {
      if (!file.endsWith('.svg')) continue;
      const iconName = basename(file, '.svg');
      if (!manifest.sets[setId].icons[iconName]) {
        manifest.sets[setId].icons[iconName] = {};
        changed = true;
      }
    }
    const total = Object.keys(manifest.sets[setId].icons).length;
    if (manifest.sets[setId].total !== total) {
      manifest.sets[setId].total = total;
      changed = true;
    }
  }

  if (changed) {
    manifest.lastUpdated = new Date().toISOString();
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }
  return manifest;
}

async function getIconSvg(set: string, name: string): Promise<string | null> {
  const filePath = join(ICONS_DIR, set, `${name}.svg`);
  try {
    await stat(filePath);
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const set = searchParams.get('set');
  const name = searchParams.get('name');
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    const manifest = await readManifest();

    // Return specific icon SVG
    if (set && name) {
      const svg = await getIconSvg(set, name);
      if (!svg) {
        return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
      }
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Search icons
    if (query) {
      const results: Array<{ set: string; name: string; categories?: string[] }> = [];
      const q = query.toLowerCase();

      for (const [setName, setData] of Object.entries(manifest.sets)) {
        for (const [iconName, iconData] of Object.entries(setData.icons)) {
          if (iconName.toLowerCase().includes(q)) {
            results.push({
              set: setName,
              name: iconName,
              categories: iconData.categories,
            });
          }
        }
      }

      const start = (page - 1) * limit;
      const paginatedResults = results.slice(start, start + limit);

      return NextResponse.json({
        icons: paginatedResults,
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
      });
    }

    // List icons in a set
    if (set) {
      const setData = manifest.sets[set];
      if (!setData) {
        return NextResponse.json({ error: 'Icon set not found' }, { status: 404 });
      }

      const iconNames = Object.keys(setData.icons);

      return NextResponse.json({
        set: setData,
        icons: iconNames,
        total: iconNames.length,
      });
    }

    // List all sets
    const sets = Object.entries(manifest.sets).filter(([, data]) => data.total > 0).map(([key, data]) => ({
      id: key,
      name: data.name,
      prefix: data.prefix,
      license: data.license,
      height: data.height,
      category: data.category,
      total: data.total,
    }));

    return NextResponse.json({
      sets,
      version: manifest.version,
      lastUpdated: manifest.lastUpdated,
    });
  } catch (error) {
    console.error('Icon API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
