import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return new NextResponse(null, { status: 401 });
  const hash = createHash('md5').update(email).digest('hex');
  return NextResponse.redirect(`https://www.gravatar.com/avatar/${hash}?s=64&d=identicon`);
}
