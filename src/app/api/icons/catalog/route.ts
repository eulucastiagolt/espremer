import { NextRequest, NextResponse } from 'next/server';
import { getIconCatalog } from '@/lib/icon-catalog';

export async function GET(request: NextRequest) {
  try {
    const family = new URL(request.url).searchParams.get('family');
    const catalog = await getIconCatalog();
    const families = catalog.map((item) => ({ id: item.id, name: item.name, prefix: item.prefix, license: item.license, height: item.height, category: item.category, total: item.icons.length }));
    if (!family) return NextResponse.json({ families }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
    const selected = catalog.find((item) => item.id === family);
    if (!selected) return NextResponse.json({ error: 'Icon family not found' }, { status: 404 });
    return NextResponse.json({ family: families.find((item) => item.id === family), icons: selected.icons.map((icon) => ({ name: icon.name, categories: icon.categories })) }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch {
    return NextResponse.json({ error: 'Icon catalog is not synchronized' }, { status: 503 });
  }
}
