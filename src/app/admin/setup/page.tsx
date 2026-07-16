import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function AdminSetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect('/admin/login');
  return <SetupForm />;
}
