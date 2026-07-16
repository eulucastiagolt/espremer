'use client';

import { useState } from 'react';
import { Check, Save } from 'lucide-react';

export default function NewIconPage() {
  const [name, setName] = useState('');
  const [svg, setSvg] = useState('');
  const [categories, setCategories] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(null); setError(null);
    const response = await fetch('/api/admin/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, svg, categories: categories.split(',').map((item) => item.trim()).filter(Boolean) }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Não foi possível cadastrar o ícone');
    else { setMessage('Ícone cadastrado e aprovado.'); setName(''); setSvg(''); setCategories(''); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Cadastrar ícone manualmente</h1>
      <form onSubmit={submit} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        {message && <p className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-600 text-sm"><Check className="w-4 h-4" />{message}</p>}
        {error && <p className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</p>}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do ícone" required className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
        <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="Categorias separadas por vírgula" className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
        <textarea value={svg} onChange={(e) => setSvg(e.target.value)} placeholder="Cole aqui o código SVG" required rows={14} className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"><Save className="w-4 h-4" />Cadastrar ícone</button>
      </form>
    </div>
  );
}
