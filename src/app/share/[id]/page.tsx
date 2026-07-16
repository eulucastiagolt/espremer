'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ShareData {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  isPublic: boolean;
}

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/share?id=${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Share não encontrado ou expirado');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([data.svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, data.name);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Link expirado ou inválido
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {error || 'Este compartilhamento não existe mais.'}
          </p>
          <Link
            href="/svg"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Espremer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {data.name}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compartilhado em {new Date(data.createdAt).toLocaleDateString('pt-BR')}
              {data.expiresAt && (
                <> · Expira em {new Date(data.expiresAt).toLocaleDateString('pt-BR')}</>
              )}
              {data.isPublic && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                  Público
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar SVG
          </button>
        </div>

        {/* Preview */}
        <div className="p-6 flex items-center justify-center min-h-[300px] bg-zinc-50 dark:bg-zinc-800/50">
          <div
            className="w-48 h-48 [&_svg]:w-full [&_svg]:h-full"
            dangerouslySetInnerHTML={{ __html: data.svg }}
          />
        </div>

        {/* Code */}
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Código SVG</span>
          </div>
          <pre className="px-6 py-4 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300 font-mono max-h-64 overflow-y-auto">
            {data.svg}
          </pre>
        </div>
      </div>

      {/* Request removal */}
      {data.isPublic && (
        <div className="mt-4 text-center">
          <Link
            href={`/remocao?id=${data.id}`}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors"
          >
            Solicitar remoção desta listagem
          </Link>
        </div>
      )}
    </div>
  );
}
