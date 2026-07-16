import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'shares.view',
  'shares.manage',
  'community.view',
  'community.manage',
  'icons.manage',
  'removals.manage',
  'platform.manage',
  'admins.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export async function getCurrentAdmin() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string } | undefined;
  if (sessionUser?.id) return prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (sessionUser?.email) return prisma.user.findUnique({ where: { email: sessionUser.email.toLowerCase().trim() } });
  return null;
}

export function isSuperAdmin(user: { role: string } | null) {
  return user?.role === 'super_admin';
}
