'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import { signOut } from 'next-auth/react';

type Profile = { name: string | null; email: string };

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', email: '' });
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch('/api/admin/profile').then((response) => response.json()).then((data) => {
        setProfile({ name: data.name || '', email: data.email || '' });
        setCurrentEmail(data.email || '');
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    const response = await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'profile', ...profile, currentPassword }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Não foi possível salvar o perfil');
    else if (data.emailChanged) await signOut({ callbackUrl: '/admin/login' });
    else setMessage('Perfil atualizado.');
    setSaving(false);
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    const response = await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password', currentPassword, newPassword, confirmPassword }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Não foi possível alterar a senha');
    else { setMessage('Senha alterada.'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Configurações</h1>
      {(error || message) && <p className={`mb-4 p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{error || message}</p>}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-4">
        <h2 className="font-medium text-zinc-900 dark:text-white mb-1">Perfil</h2>
        <p className="text-xs text-zinc-400 mb-4">O avatar é atualizado automaticamente pelo Gravatar usando seu e-mail.</p>
        <form onSubmit={saveProfile} className="space-y-4">
          <input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Nome completo" required className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
          <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="E-mail" required className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
          {profile.email !== currentEmail && <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Senha atual para confirmar o novo e-mail" required className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />}
          <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"><Save className="w-4 h-4" />Salvar perfil</button>
        </form>
      </section>
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="font-medium text-zinc-900 dark:text-white mb-1">Alterar senha</h2>
        <p className="text-xs text-zinc-400 mb-4">Use pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo.</p>
        <form onSubmit={changePassword} className="space-y-4">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Senha atual" required className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" required minLength={8} className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" required minLength={8} className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
          <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Alterar senha</button>
        </form>
      </section>
    </div>
  );
}
