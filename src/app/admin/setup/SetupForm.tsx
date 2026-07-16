'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Shield } from 'lucide-react';

function normalizeForPasswordCheck(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const passwordRequirements = [
    'Pelo menos 8 caracteres',
    'Uma letra minúscula',
    'Uma letra maiúscula',
    'Um número',
    'Um símbolo, como !, @ ou #',
  ];
  const personalInfoParts = [
    ...normalizeForPasswordCheck(fullName).split(/\s+/),
    ...normalizeForPasswordCheck(email.split('@')[0]).split(/[^a-z0-9]+/),
  ].filter((part) => part.length >= 3);
  const passwordContainsPersonalInfo = Boolean(password) && personalInfoParts.some((part) =>
    normalizeForPasswordCheck(password).includes(part),
  );
  const passwordScore = passwordChecks.filter(Boolean).length;
  const passwordStrength = [
    { label: 'Muito fraca', color: 'bg-red-500' },
    { label: 'Fraca', color: 'bg-orange-500' },
    { label: 'Razoável', color: 'bg-yellow-500' },
    { label: 'Boa', color: 'bg-blue-500' },
    { label: 'Forte', color: 'bg-green-500' },
  ][Math.max(passwordScore - 1, 0)];

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName) return;

    if (passwordScore < passwordChecks.length) {
      setError('A senha deve ter 8 caracteres, maiúscula, minúscula, número e símbolo.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if setup is still allowed
      const checkRes = await fetch('/api/admin/setup/check');
      const checkData = await checkRes.json().catch(() => null);

      if (!checkRes.ok || !checkData) {
        throw new Error(checkData?.error || 'Não foi possível verificar o status do setup.');
      }

      if (!checkData.allowed) {
        setError('Setup já foi concluído. Esta página está desativada.');
        setLoading(false);
        return;
      }

      // Create user
      const createRes = await fetch('/api/admin/setup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, fullName }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => null);
        throw new Error(data?.error || 'Erro ao criar administrador');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar administrador');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Administrador configurado!
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Você já pode fazer login no painel administrativo.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Configuração Inicial
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Crie o primeiro administrador do sistema
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
              <div className="mt-2">
                <div className="flex gap-1" aria-label={`Força da senha: ${passwordStrength.label}`}>
                  {passwordChecks.map((passed, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full ${passed ? passwordStrength.color : 'bg-zinc-200 dark:bg-zinc-700'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {password ? passwordStrength.label : 'Use maiúsculas, minúsculas, número e símbolo'}
                </p>
                <div className="mt-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-2.5">
                  <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Sua senha precisa ter:
                  </p>
                  <ul className="space-y-0.5">
                    {passwordRequirements.map((requirement, index) => (
                      <li
                        key={requirement}
                        className={`text-[11px] ${passwordChecks[index] ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`}
                      >
                        {passwordChecks[index] ? '✓' : '○'} {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
                {passwordContainsPersonalInfo && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2" role="status">
                    Por segurança, evite usar partes do seu nome ou e-mail na senha.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                autoComplete="new-password"
                className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:border-blue-400 outline-none"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">As senhas não coincidem.</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword || !fullName || passwordScore < passwordChecks.length || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar administrador
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
