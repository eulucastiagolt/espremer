import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/platform-settings';

export async function GET() {
  const settings = await getPlatformSettings();
  return NextResponse.json({ maintenanceMode: settings.maintenanceMode, siteName: settings.siteName, maintenanceTitle: settings.maintenanceTitle, maintenanceContent: settings.maintenanceContent }, { headers: { 'Cache-Control': 'no-store' } });
}
