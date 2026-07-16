'use client';

import { useState, useCallback } from 'react';
import { Link2, Copy, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ShareDialogProps {
  svg: string;
  name: string;
  onClose: () => void;
}

type Duration = '1h' | '24h' | '7d' | '30d' | 'never';

const DURATIONS: { value: Duration; label: string; description: string }[] = [
  { value: '1h', label: '1 hora', description: 'Expira em 1 hora' },
  { value: '24h', label: '24 horas', description: 'Expira em 24 horas' },
  { value: '7d', label: '7 dias', description: 'Expira em 7 dias' },
  { value: '30d', label: '30 dias', description: 'Expira em 30 dias' },
  { value: 'never', label: 'Nunca', description: 'Sem expiração (listagem pública)' },
];

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) throw new Error('Não foi possível copiar o link');
}

export default function ShareDialog({ svg, name, onClose }: ShareDialogProps) {
  const [duration, setDuration] = useState<Duration>('24h');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateUrl, setDuplicateUrl] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (duration === 'never' && !acceptedTerms) return;
    setCreating(true);
    setError(null);
    setDuplicateUrl(null);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg, name, duration }),
      });
      if (!res.ok) throw new Error('Erro ao criar compartilhamento');
      const data = await res.json();
      if (data.duplicate) {
        setDuplicateUrl(`${window.location.origin}${data.url}`);
      } else {
        setShareUrl(`${window.location.origin}${data.url}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCreating(false);
    }
  }, [svg, name, duration, acceptedTerms]);

  const handleCopy = useCallback(async () => {
    const urlToCopy = shareUrl || duplicateUrl;
    if (!urlToCopy) return;
    try {
      await copyText(urlToCopy);
      setError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie o link manualmente.');
    }
  }, [shareUrl, duplicateUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Compartilhar ícone
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {shareUrl ? (
            /* Link gerado */
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 bg-transparent outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-zinc-400 text-center">
                {duration === 'never'
                  ? 'Este ícone será listado publicamente.'
                  : `Expira em ${DURATIONS.find((d) => d.value === duration)?.label}.`}
              </p>
            </div>
          ) : duplicateUrl ? (
            /* Ícone duplicado */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                  Ícone já compartilhado
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Este ícone já foi compartilhado anteriormente. O link existente é:
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <input
                  readOnly
                  value={duplicateUrl}
                  className="flex-1 text-xs text-zinc-700 dark:text-zinc-300 bg-transparent outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          ) : (
            /* Formulário */
            <>
              {/* Duração */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                  Expiração
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                        duration === d.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      title={d.description}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning for "never" */}
              {duration === 'never' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      <p className="font-medium mb-1">Listagem pública</p>
                      <p>
                        Este ícone ficará disponível publicamente na seção &ldquo;Community&rdquo;.
                        Qualquer pessoa com o link poderá acessá-lo.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Li e concordo com os{' '}
                      <Link href="/termos-de-uso" target="_blank" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
                        termos de uso
                      </Link>{' '}
                      e a{' '}
                      <Link href="/privacidade" target="_blank" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
                        política de privacidade
                      </Link>
                    </span>
                  </label>
                </div>
              )}

            </>
          )}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        {!shareUrl && !duplicateUrl && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleShare}
              disabled={creating || (duration === 'never' && !acceptedTerms)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  Compartilhar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
