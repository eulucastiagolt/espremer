'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  X,
  Trash2,
  Loader2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Status = 'pending' | 'approved' | 'rejected';

interface CommunityIcon {
  id: string;
  name: string;
  svg: string;
  status: Status;
  submittedBy: string | null;
  authorEmail: string | null;
  authorVerified: boolean;
  rejectionReason: string | null;
  createdAt: string;
}

export default function AdminCommunityPage() {
  const [icons, setIcons] = useState<CommunityIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<CommunityIcon | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchIcons = async () => {
    const url = statusFilter !== 'all'
      ? `/api/admin/community?status=${statusFilter}`
      : '/api/admin/community';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setIcons(data);
    } else {
      setIcons([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchIcons(), 0);
    return () => window.clearTimeout(timer);
    // fetchIcons uses the current status filter and is intentionally recreated per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    await fetch('/api/admin/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    await fetchIcons();
    setProcessing(null);
  };

  const handleReject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejecting || !rejectionReason.trim()) return;
    setProcessing(rejecting.id);
    const response = await fetch('/api/admin/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rejecting.id, status: 'rejected', reason: rejectionReason.trim() }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setProcessing(null);
      setRejectionError(data.error || 'Não foi possível recusar o envio.');
      return;
    }
    await fetchIcons();
    setProcessing(null);
    setRejecting(null);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleDelete = async (id: string) => {
    setProcessing(id);
    await fetch(`/api/admin/community?id=${id}`, { method: 'DELETE' });
    setIcons((prev) => prev.filter((i) => i.id !== id));
    setProcessing(null);
    setDeleteTarget(null);
  };

  const filtered = icons.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.submittedBy?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  const statusConfig = {
    pending: { label: 'Pendente', icon: Clock, color: 'amber' },
    approved: { label: 'Aprovado', icon: CheckCircle, color: 'green' },
    rejected: { label: 'Rejeitado', icon: XCircle, color: 'red' },
  };

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
          Comunidade
        </h1>
        <span className="text-xs text-zinc-400">{icons.length} total</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou autor..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {status === 'all' ? 'Todos' : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Icons list */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Nenhum ícone encontrado.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((icon) => {
              const statusInfo = statusConfig[icon.status];
              const StatusIcon = statusInfo.icon;
              return (
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
                       {icon.authorEmail || icon.submittedBy || 'Anônimo'} ·{' '}
                       {new Date(icon.createdAt).toLocaleDateString('pt-BR')}
                     </p>
                     {icon.authorEmail && !icon.authorVerified && <p className="text-[11px] text-amber-600 mt-1">E-mail do autor não verificado</p>}
                  </div>

                  {/* Status */}
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      statusInfo.color === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : statusInfo.color === 'green'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {icon.status === 'pending' && (
                      <>
                        <button
                          onClick={() => void handleApprove(icon.id)}
                           disabled={processing === icon.id || !icon.authorVerified}
                          className="p-1.5 text-green-500 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                           onClick={() => { setRejecting(icon); setRejectionReason(''); setRejectionError(null); }}
                          disabled={processing === icon.id}
                          className="p-1.5 text-amber-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                          title="Rejeitar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                       onClick={() => setDeleteTarget(icon.id)}
                      disabled={processing === icon.id}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      title="Excluir"
                    >
                      {processing === icon.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                     </div>
                     {icon.status === 'rejected' && icon.rejectionReason && <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">Motivo: {icon.rejectionReason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <form onSubmit={handleReject} className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl">
            <h2 id="reject-title" className="text-lg font-semibold text-zinc-900 dark:text-white">Recusar envio</h2>
            <p className="text-sm text-zinc-500 mt-1">Informe ao autor por que “{rejecting.name}” foi recusado.</p>
            <textarea required autoFocus value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Descreva o motivo da recusa..." rows={5} className="mt-4 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-400 resize-y" />
            {rejectionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{rejectionError}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setRejecting(null); setRejectionReason(''); setRejectionError(null); }} className="px-3 py-2 text-sm rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancelar</button>
              <button type="submit" disabled={!rejectionReason.trim() || processing === rejecting.id} className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">Recusar envio</button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog open={Boolean(deleteTarget)} title="Excluir ícone" description="Tem certeza que deseja excluir este ícone? Esta ação não pode ser desfeita." confirmLabel="Excluir" onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void handleDelete(deleteTarget); }} />
    </div>
  );
}
