'use client';

import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { readResponseJson } from '@/lib/read-response-json';

export default function CommunityLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null);
    const result = await signIn('credentials', { email: email.toLowerCase().trim(), password, redirect: false });
    if (result?.error) setError('E-mail ou senha inválidos ou conta ainda não confirmada.'); else router.push('/community');
    setLoading(false);
  };

  const resendVerification = async () => {
    setResending(true); setResendMessage(null);
    const response = await fetch('/api/community/verify/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await readResponseJson<{ message?: string }>(response);
    setResendMessage(data.message || 'Verifique sua caixa de entrada.');
    setResending(false);
  };

  return <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4"><div className="w-full max-w-sm"><div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6"><div className="text-center mb-6"><div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4"><LogIn className="w-6 h-6 text-blue-500" /></div><h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Área da Comunidade</h1><p className="text-xs text-zinc-400 mt-1">Entre para gerenciar seus ícones</p></div><form onSubmit={handleLogin} className="space-y-4"><div><label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 outline-none" /></div><div><label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 outline-none" /></div>{error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"><p>{error}</p><button type="button" onClick={() => void resendVerification()} disabled={resending || !email} className="mt-2 text-blue-600 hover:underline disabled:opacity-50">{resending ? 'Enviando...' : 'Reenviar link de confirmação'}</button></div>}{resendMessage && <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">{resendMessage}</p>}<button disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading && <Loader2 className="w-4 h-4 animate-spin" />}Entrar</button></form><p className="text-xs text-center text-zinc-500 mt-5">Ainda não tem conta? <Link href="/community/register" className="text-blue-600 hover:underline">Criar conta</Link></p></div></div></div>;
}
