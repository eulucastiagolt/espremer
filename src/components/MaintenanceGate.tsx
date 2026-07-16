'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [maintenance, setMaintenance] = useState<{ enabled: boolean; title: string; content: string }>({ enabled: false, title: '', content: '' });
  useEffect(() => { if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return; fetch('/api/platform/status', { cache: 'no-store' }).then((response) => response.json()).then((data) => setMaintenance({ enabled: Boolean(data.maintenanceMode), title: data.maintenanceTitle, content: data.maintenanceContent })).catch(() => {}); }, [pathname]);
  if (maintenance.enabled) return <main className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4"><div className="max-w-2xl text-center"><h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{maintenance.title}</h1><div className="prose prose-zinc dark:prose-invert mx-auto text-sm text-zinc-500 dark:text-zinc-400" dangerouslySetInnerHTML={{ __html: maintenance.content }} /></div></main>;
  return <>{children}</>;
}
