'use client';

import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, X } from 'lucide-react';

type RemovalRequest = {
  id: string;
  shareId: string;
  shareName: string;
  reason: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  svg: string;
};

const statusLabel = { pending: 'Em análise', approved: 'Aprovada', rejected: 'Recusada' };

export default function AdminRemovalsPage() {
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = async () => {
    const response = await fetch('/api/admin/removals');
    if (response.ok) setRequests(await response.json());
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRequests(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    const response = await fetch('/api/admin/removals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok) {
      const updated = await response.json();
      setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    setProcessing(null);
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Solicitações de remoção</h1>
        <span className="text-xs text-zinc-400">{requests.filter((item) => item.status === 'pending').length} pendentes</span>
      </div>
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-zinc-400">Nenhuma solicitação recebida.</p>}
        {requests.map((item) => (
          <article key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
             <div className="flex items-start justify-between gap-4">
               <div className="w-20 h-20 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg }} />
               <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{item.shareName}</h2>
                <p className="text-xs text-zinc-400 mt-1">ID: {item.shareId} · {new Date(item.createdAt).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Solicitante: {item.email}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Clock className="w-3 h-3" />{statusLabel[item.status]}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 mt-3 whitespace-pre-wrap">{item.reason}</p>
            {item.status === 'pending' && (
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => void updateStatus(item.id, 'rejected')} disabled={processing === item.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"><X className="w-3.5 h-3.5" />Recusar</button>
                <button onClick={() => void updateStatus(item.id, 'approved')} disabled={processing === item.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">{processing === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Aprovar e remover</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
