import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { ADMIN_PERMISSIONS, type AdminPermission } from '@/lib/admin-auth';

type PermissionStore = Record<string, AdminPermission[]>;
const FILE = join(process.cwd(), 'src', 'data', 'admin-permissions.json');

async function readStore(): Promise<PermissionStore> {
  try { return JSON.parse(await readFile(FILE, 'utf8')) as PermissionStore; } catch { return {}; }
}

export async function getUserPermissions(userId: string, role: string) {
  if (role === 'super_admin') return [...ADMIN_PERMISSIONS];
  const store = await readStore();
  return store[userId] || [];
}

export async function setUserPermissions(userId: string, permissions: string[]) {
  const store = await readStore();
  store[userId] = permissions.filter((permission): permission is AdminPermission => ADMIN_PERMISSIONS.includes(permission as AdminPermission));
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2) + '\n');
  return store[userId];
}

export async function hasUserPermission(user: { id: string; role: string } | null, permission: AdminPermission) {
  if (!user) return false;
  if (user.role === 'community') return false;
  if (user.role === 'super_admin') return true;
  return (await getUserPermissions(user.id, user.role)).includes(permission);
}
