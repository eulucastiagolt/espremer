'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { readResponseJson } from '@/lib/read-response-json';

function VerifyContent() {
  const params = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu e-mail...');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch('/api/community/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.get('token') }) }).then(async (response) => { const data = await readResponseJson<{ error?: string }>(response); if (!response.ok) throw new Error(data.error || 'Link inválido ou expirado.'); setState('success'); setMessage('E-mail confirmado com sucesso.'); }).catch((error) => { setState('error'); setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar o e-mail.'); });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);
  return <main className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4"><div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">{state === 'loading' ? <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" /> : <CheckCircle2 className={`w-10 h-10 mx-auto mb-4 ${state === 'success' ? 'text-green-500' : 'text-red-500'}`} />}<h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{message}</h1>{state !== 'loading' && <Link href="/community/login" className="inline-block mt-5 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Ir para o login</Link>}</div></main>;
}

export default function VerifyPage() { return <Suspense><VerifyContent /></Suspense>; }
