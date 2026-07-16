import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const readCatalog = unstable_cache(
  async () => prisma.iconFamily.findMany({
    orderBy: { name: 'asc' },
    include: { icons: { where: { isActive: true }, orderBy: { name: 'asc' } } },
  }),
  ['icon-catalog-v1'],
  { revalidate: 3600, tags: ['icon-catalog'] },
);

export async function getIconCatalog() {
  return readCatalog();
}
