import localManifest from '@/data/icons/manifest.json';

type CatalogFamily = {
  id: string;
  name: string;
  prefix: string;
  license: string;
  height: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  icons: Array<{
    id: string;
    familyId: string;
    name: string;
    filePath: string;
    hash: string;
    categories: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function getLocalCatalog(): CatalogFamily[] {
  const sets = localManifest.sets as Record<string, {
    name: string;
    prefix: string;
    license: string;
    height: number;
    category: string;
    icons: Record<string, { categories?: string[] }>;
  }>;

  return Object.entries(sets).map(([id, family]) => ({
    id,
    name: family.name,
    prefix: family.prefix,
    license: family.license,
    height: family.height,
    category: family.category,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    icons: Object.entries(family.icons).map(([name, data]) => ({
      id: `${id}:${name}`,
      familyId: id,
      name,
      filePath: `icons/${id}/${name}.svg`,
      hash: '',
      categories: data.categories || [],
      isActive: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    })),
  }));
}

export async function getIconCatalog() {
  // Curated icons are versioned with the application and need no database sync.
  return getLocalCatalog();
}
