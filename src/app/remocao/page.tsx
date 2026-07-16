'use client';

import { Suspense, useState, useCallback } from 'react';
import { ArrowLeft, Send, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import HCaptcha from '@/components/ui/HCaptcha';

function RemocaoPage() {
  const searchParams = useSearchParams();
  const [shareId, setShareId] = useState(searchParams.get('id') || '');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareId.trim() || !reason.trim() || !consent || !captchaToken) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId: shareId.trim(), reason, email: email || undefined, captchaToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao processar solicitação');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Solicitar Remoção
        </h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Solicite a remoção de um ícone compartilhado publicamente na plataforma.
      </p>

      {submitted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            Solicitação enviada
          </h2>
           <p className="text-sm text-green-700 dark:text-green-400 mb-4">
             Sua solicitação foi enviada ao administrador e está em análise. Você receberá um e-mail com a decisão.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Falar com suporte
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">Antes de solicitar</p>
              <p>
                Certifique-se de que possui o direito de solicitar a remoção deste ícone.
                Apenas o autor do compartilhamento ou titular dos direitos autorais pode solicitar remoção.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              ID do Compartilhamento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shareId}
              onChange={(e) => setShareId(e.target.value)}
              placeholder="Ex: 1e24c8a5a9c8a4d7"
              required
              className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Você encontra o ID na URL do compartilhamento ou no e-mail de confirmação.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Motivo da remoção <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da solicitação de remoção..."
              required
              rows={4}
              className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
               E-mail para contato <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
               placeholder="seu@email.com"
               required
              className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
            />
            <p className="text-xs text-zinc-400 mt-1">
               Enviaremos a confirmação do recebimento e o resultado da análise para este endereço.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="lgpd-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="lgpd-consent" className="text-xs text-zinc-500 dark:text-zinc-400">
              Confirmo que sou o autor do compartilhamento ou titular dos direitos autorais e
              autorizo o tratamento dos meus dados pessoais para fins de atendimento desta
              solicitação de remoção, conforme a LGPD (Lei nº 13.709/2018) e nossa{' '}
              <Link href="/privacidade" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
                Política de Privacidade
              </Link>.
            </label>
          </div>

          <div className="flex justify-center">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
              onVerify={handleCaptchaVerify}
              onExpire={handleCaptchaExpire}
              theme="dark"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
             disabled={loading || !shareId.trim() || !reason.trim() || !email.trim() || !consent || !captchaToken}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Solicitar Remoção
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function RemocaoPageWithSuspense() {
  return (
    <Suspense fallback={null}>
      <RemocaoPage />
    </Suspense>
  );
}
