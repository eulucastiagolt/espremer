import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, isSuperAdmin } from '@/lib/admin-auth';
import { getPlatformSettings, savePlatformSettings } from '@/lib/platform-settings';

export async function GET() {
  const user = await getCurrentAdmin();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: 'Apenas o super administrador pode acessar' }, { status: 403 });
  return NextResponse.json(await getPlatformSettings());
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!isSuperAdmin(user)) return NextResponse.json({ error: 'Apenas o super administrador pode alterar configurações' }, { status: 403 });
  const body = await request.json();
  const current = await getPlatformSettings();
  const maintenanceContent = typeof body.maintenanceContent === 'string'
    ? body.maintenanceContent.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    : current.maintenanceContent;
  const settings = {
    ...current,
    siteName: typeof body.siteName === 'string' && body.siteName.trim() ? body.siteName.trim() : current.siteName,
    contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail.trim() : current.contactEmail,
    maintenanceMode: Boolean(body.maintenanceMode),
    maintenanceTitle: typeof body.maintenanceTitle === 'string' && body.maintenanceTitle.trim() ? body.maintenanceTitle.trim() : current.maintenanceTitle,
    maintenanceContent,
    allowPublicSharing: Boolean(body.allowPublicSharing),
    defaultShareDuration: ['1h', '24h', '7d', '30d', 'never'].includes(body.defaultShareDuration) ? body.defaultShareDuration : current.defaultShareDuration,
  } as typeof current;
  return NextResponse.json(await savePlatformSettings(settings));
}
