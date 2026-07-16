import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

export type PlatformSettings = {
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceContent: string;
  allowPublicSharing: boolean;
  defaultShareDuration: '1h' | '24h' | '7d' | '30d' | 'never';
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: 'Espremer',
  contactEmail: '',
  maintenanceMode: false,
  maintenanceTitle: 'Plataforma em manutenção',
  maintenanceContent: '<p>Estamos realizando melhorias. Tente novamente em alguns minutos.</p>',
  allowPublicSharing: true,
  defaultShareDuration: '24h',
};

const FILE = join(process.cwd(), 'src', 'data', 'platform-settings.json');

export async function getPlatformSettings() {
  try { return { ...DEFAULT_PLATFORM_SETTINGS, ...(JSON.parse(await readFile(FILE, 'utf8')) as Partial<PlatformSettings>) }; } catch { return DEFAULT_PLATFORM_SETTINGS; }
}

export async function savePlatformSettings(settings: PlatformSettings) {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(settings, null, 2) + '\n');
  return settings;
}
