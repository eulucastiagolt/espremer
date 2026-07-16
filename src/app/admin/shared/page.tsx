'use client';

import { useEffect, useState } from 'react';
import { Trash2, ExternalLink, Loader2, Search, Eye, EyeOff } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface SharedIcon {
  id: string;
  name: string;
  svg: string;
  isPublic: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminSharedPage() {
  const [icons, setIcons] = useState<SharedIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchIcons = async () => {
    const res = await fetch('/api/admin/shared', { cache: 'no-store' });
    const data = await res.json();
    setIcons(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchIcons(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/admin/shared?id=${id}`, { method: 'DELETE' });
    setIcons((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
    setDeleteTarget(null);
  };

  const handleTogglePublic = async (id: string, current: boolean) => {
    await fetch('/api/admin/shared', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublic: !current }),
    });
    setIcons((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isPublic: !current } : i)),
    );
  };

  const filtered = icons.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Ícones Compartilhados
        </h1>
        <span className="text-xs text-zinc-400">{icons.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou ID..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
        />
      </div>

      {/* Icons list */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Nenhum ícone encontrado.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((icon) => (
              <div
                key={icon.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                {/* Preview */}
                <div
                  className="w-10 h-10 flex-shrink-0 [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-current text-zinc-600 dark:text-zinc-400"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {icon.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {icon.id.slice(0, 8)}... ·{' '}
                    {new Date(icon.createdAt).toLocaleDateString('pt-BR')}
                    {icon.expiresAt && (
                      <> · Expira {new Date(icon.expiresAt).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    icon.isPublic
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {icon.isPublic ? 'Público' : 'Privado'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePublic(icon.id, icon.isPublic)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title={icon.isPublic ? 'Tornar privado' : 'Tornar público'}
                  >
                    {icon.isPublic ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`/share/${icon.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Abrir link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                      onClick={() => setDeleteTarget(icon.id)}
                    disabled={deleting === icon.id}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    title="Excluir"
                  >
                    {deleting === icon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={Boolean(deleteTarget)} title="Excluir ícone compartilhado" description="Tem certeza que deseja excluir este ícone? Esta ação não pode ser desfeita." confirmLabel="Excluir" onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget); }} />
    </div>
  );
}
