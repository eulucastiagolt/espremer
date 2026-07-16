'use client';

import { useEffect, useState } from 'react';
import { Share2, Users, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalShared: number;
  publicIcons: number;
  pendingReview: number;
  approvedIcons: number;
  recentShares: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Ícones Compartilhados',
      value: stats?.totalShared ?? 0,
      icon: Share2,
      color: 'blue',
    },
    {
      label: 'Ícones Públicos',
      value: stats?.publicIcons ?? 0,
      icon: Users,
      color: 'green',
    },
    {
      label: 'Aguardando Revisão',
      value: stats?.pendingReview ?? 0,
      icon: Clock,
      color: 'amber',
    },
    {
      label: 'Aprovados (Comunidade)',
      value: stats?.approvedIcons ?? 0,
      icon: Users,
      color: 'purple',
    },
    {
      label: 'Compartilhados (7 dias)',
      value: stats?.recentShares ?? 0,
      icon: AlertTriangle,
      color: 'zinc',
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  card.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : card.color === 'green'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : card.color === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : card.color === 'purple'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                <card.icon
                  className={`w-5 h-5 ${
                    card.color === 'blue'
                      ? 'text-blue-500'
                      : card.color === 'green'
                        ? 'text-green-500'
                        : card.color === 'amber'
                          ? 'text-amber-500'
                          : card.color === 'purple'
                            ? 'text-purple-500'
                            : 'text-zinc-500'
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {card.value}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
