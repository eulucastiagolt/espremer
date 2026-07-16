'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Send, Mail, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import HCaptcha from '@/components/ui/HCaptcha';

type Subject = 'duvida' | 'sugestao' | 'problema' | 'outro';

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'duvida', label: 'Dúvida' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'problema', label: 'Reportar problema' },
  { value: 'outro', label: 'Outro' },
];

export default function ContatoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<Subject>('duvida');
  const [message, setMessage] = useState('');
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
    if (!name.trim() || !email.trim() || !message.trim() || !consent || !captchaToken) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, captchaToken }),
      });

      if (!res.ok) throw new Error('Erro ao enviar mensagem');

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.');
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
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Contato
        </h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Envie sua mensagem e retornaremos o mais breve possível.
      </p>

      {submitted ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            Mensagem enviada
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">
            Obrigado pelo contato! Retornaremos em até 48 horas úteis.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Assunto
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSubject(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    subject === s.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mensagem <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua mensagem..."
              required
              rows={5}
              className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none resize-none"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-zinc-400">
            <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Seus dados serão utilizados apenas para responder sua solicitação, conforme nossa{' '}
              <Link href="/privacidade" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
                Política de Privacidade
              </Link>.
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
              Li e concordo com a{' '}
              <Link href="/privacidade" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
                Política de Privacidade
              </Link>{' '}
              e autorizo o tratamento dos meus dados pessoais para fins de atendimento desta
              solicitação, conforme a LGPD (Lei nº 13.709/2018).
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
            disabled={loading || !name.trim() || !email.trim() || !message.trim() || !consent || !captchaToken}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar mensagem
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
