'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface DropdownProps {
  /** Conteúdo do botão que abre o menu. */
  trigger: ReactNode;
  /** Itens do menu ou conteúdo livre. */
  children: ReactNode;
  /** Alinhar o menu à direita do trigger (default true). */
  align?: 'left' | 'right';
  /** Largura mínima do menu. */
  menuClassName?: string;
  /** Classe extra do trigger wrapper. */
  className?: string;
  /** Desabilita o botão. */
  disabled?: boolean;
}

/**
 * Dropdown/popover leve: clique no trigger abre, clique fora ou Esc fecha.
 * Sem dependência de portal — posição absoluta relativa ao wrapper.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right',
  menuClassName = '',
  className = '',
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-30 mt-1 ${align === 'right' ? 'right-0' : 'left-0'} min-w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/30 overflow-hidden ${menuClassName}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Item de menu padrão com hover e fechar ao clicar. */
export function DropdownItem({
  children,
  onClick,
  icon,
  disabled = false,
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : danger
            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/** Separador horizontal. */
export function DropdownSeparator() {
  return <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />;
}
