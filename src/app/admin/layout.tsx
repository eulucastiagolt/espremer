'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Share2,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  Loader2,
  Trash2,
  PlusCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/shared', label: 'Ícones Compartilhados', icon: Share2 },
  { href: '/admin/community', label: 'Comunidade', icon: Users },
  { href: '/admin/removals', label: 'Solicitações de Remoção', icon: Trash2 },
  { href: '/admin/icons', label: 'Famílias e Ícones', icon: PlusCircle },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
  { href: '/admin/platform', label: 'Plataforma', icon: Settings },
  { href: '/admin/admins', label: 'Usuários', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarUrl = session?.user?.email ? '/api/admin/avatar' : null;
  const isPublicPage = pathname === '/admin/login' || pathname === '/admin/setup' || pathname === '/admin/activate';

  useEffect(() => {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === 'community') {
      router.replace('/community');
      return;
    }
    if (!isPublicPage && status === 'unauthenticated') {
      router.replace('/admin/login');
    }
  }, [isPublicPage, router, session?.user, status]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  if (isPublicPage) return <>{children}</>;

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <Link href="/admin" className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Espremer Admin
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {avatarUrl ? (
                  <div
                    className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                    role="img"
                    aria-label="Avatar do usuário"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                    {session?.user?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <p className="text-xs text-zinc-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-zinc-600 dark:text-zinc-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            Espremer Admin
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
