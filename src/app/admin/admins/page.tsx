'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Save, UserPlus } from 'lucide-react';

const PERMISSIONS = [
  { id: 'dashboard.view', label: 'Dashboard' },
  { id: 'shares.view', label: 'Visualizar compartilhados' },
  { id: 'shares.manage', label: 'Gerenciar compartilhados' },
  { id: 'community.view', label: 'Visualizar comunidade' },
  { id: 'community.manage', label: 'Gerenciar comunidade' },
  { id: 'icons.manage', label: 'Gerenciar famílias e ícones' },
  { id: 'removals.manage', label: 'Gerenciar remoções' },
  { id: 'platform.manage', label: 'Configurar plataforma' },
  { id: 'admins.manage', label: 'Gerenciar usuários' },
];

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super administrador',
  community: 'Comunidade',
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('community');
  const [generatePassword, setGeneratePassword] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(['dashboard.view']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    if (response.ok) setUsers(await response.json());
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, generatePassword, permissions }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Não foi possível criar o usuário.');
      return;
    }
    setMessage(generatePassword ? 'Usuário criado. O convite foi enviado por e-mail.' : 'Usuário criado.');
    setName(''); setEmail(''); setPassword(''); setGeneratePassword(false); setRole('community');
    await load();
  };

  const update = async (user: UserRecord) => {
    setSaving(user.id);
    setError('');
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error || 'Não foi possível atualizar o usuário.');
    } else {
    setMessage('Usuário atualizado.');
    await load();
      if ((session?.user as { id?: string } | undefined)?.id === user.id && user.role === 'community') {
        await signOut({ callbackUrl: '/community' });
        return;
      }
    }
    setSaving(null);
  };

  const togglePermission = (userId: string, permission: string) => {
    setUsers((current) => current.map((user) => user.id !== userId ? user : {
      ...user,
      permissions: user.permissions.includes(permission)
        ? user.permissions.filter((item) => item !== permission)
        : [...user.permissions, permission],
    }));
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Usuários</h1>
      <p className="text-sm text-zinc-500 mb-6">Gerencie usuários, tipos de conta e as regras de acesso de cada perfil.</p>

      <form onSubmit={create} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-5 space-y-3">
        <h2 className="font-medium text-zinc-900 dark:text-white">Novo usuário</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm" />
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200">
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input required={!generatePassword} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={generatePassword ? 'Senha por convite' : 'Senha forte'} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm" />
        </div>
        <label className="text-xs text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={generatePassword} onChange={(event) => setGeneratePassword(event.target.checked)} className="mr-1" />Gerar senha e enviar link de ativação</label>
        {role !== 'community' && <div className="flex flex-wrap gap-x-4 gap-y-2"><span className="w-full text-xs font-medium text-zinc-500">Privilégios administrativos</span>{PERMISSIONS.map((permission) => <label key={permission.id} className="text-xs text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={permissions.includes(permission.id)} onChange={() => setPermissions((current) => current.includes(permission.id) ? current.filter((item) => item !== permission.id) : [...current, permission.id])} className="mr-1" />{permission.label}</label>)}</div>}
        <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm"><UserPlus className="w-4 h-4" />Cadastrar usuário</button>
        {message && <p className="text-sm text-blue-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="space-y-3">
        {users.map((user) => (
          <article key={user.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0"><p className="font-medium text-zinc-900 dark:text-white truncate">{user.name || 'Sem nome'}</p><p className="text-xs text-zinc-400 truncate">{user.email}</p></div>
              <select value={user.role} onChange={(event) => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role: event.target.value } : item))} disabled={user.role === 'super_admin'} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 disabled:opacity-60">
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <label className="text-xs text-zinc-500"><input type="checkbox" checked={user.isActive} onChange={(event) => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, isActive: event.target.checked } : item))} className="mr-1" />Ativo</label>
              <button type="button" onClick={() => void update(user)} disabled={saving === user.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm disabled:opacity-50"><Save className="w-4 h-4" />{saving === user.id ? 'Salvando...' : 'Salvar'}</button>
            </div>
            {user.role !== 'community' && <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800"><span className="w-full text-xs font-medium text-zinc-500">Privilégios administrativos</span>{PERMISSIONS.map((permission) => <label key={permission.id} className="text-xs text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={user.permissions.includes(permission.id)} onChange={() => togglePermission(user.id, permission.id)} disabled={user.role === 'super_admin'} className="mr-1" />{permission.label}</label>)}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
