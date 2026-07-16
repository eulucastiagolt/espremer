'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, Info, ExternalLink, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/images', label: 'Imagens' },
  { href: '/svg', label: 'SVG' },
  { href: '/community', label: 'Comunidade' },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const icons = { light: Sun, dark: Moon, system: Monitor };
  const labels = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };
  const Icon = icons[theme];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Tema"
      >
        <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[120px]">
            {(['light', 'dark', 'system'] as const).map((t) => {
              const ThemeIcon = icons[t];
              return (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${theme === t ? 'text-blue-500 font-medium' : 'text-zinc-700 dark:text-zinc-300'}`}
                >
                  <ThemeIcon className="w-4 h-4" />
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Espremer
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">
                Imagens &amp; SVG
              </p>
            </div>
          </Link>

          {/* Navigation + controls */}
          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-1 mr-2">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
              <Info className="w-3.5 h-3.5" />
              <span>100% no navegador</span>
            </div>
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="GitHub"
            >
              <ExternalLink className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
