'use client';

import { useEffect, useState } from 'react';
import { FolderPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Family = { id: string; name: string; prefix: string; license: string; height: number; category: string; total: number };

export default function IconManagerPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selected, setSelected] = useState('');
  const [icons, setIcons] = useState<string[]>([]);
  const [manifestVersion, setManifestVersion] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [iconName, setIconName] = useState('');
  const [svg, setSvg] = useState('');
  const [categories, setCategories] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ family: string; icon?: string } | null>(null);

  const loadFamilies = async () => {
    const response = await fetch('/api/admin/icon-families');
    const data = await response.json();
    if (response.ok) setFamilies(data);
    setLoading(false);
  };

  const loadIcons = async (family: string) => {
    setSelected(family);
    setIcons([]);
    const response = await fetch(`/api/admin/icon-families?family=${encodeURIComponent(family)}`);
    if (response.ok) {
      const data = await response.json();
      setIcons(data.icons);
      setManifestVersion(data.updatedAt);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFamilies(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const createFamily = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setMessage(null);
    const response = await fetch('/api/admin/icon-families', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-family', id: familyId, name: familyName }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else { setMessage('Família criada.'); setFamilyId(''); setFamilyName(''); await loadFamilies(); }
  };

  const addIcon = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setMessage(null);
    const response = await fetch('/api/admin/icon-families', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-icon', family: selected, name: iconName, svg, categories: categories.split(',').map((item) => item.trim()).filter(Boolean) }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else { setMessage('Ícone adicionado.'); setIconName(''); setSvg(''); setCategories(''); await loadIcons(selected); await loadFamilies(); }
  };

  const remove = async (family: string, icon?: string) => {
    const query = `family=${encodeURIComponent(family)}${icon ? `&icon=${encodeURIComponent(icon)}` : ''}`;
    const response = await fetch(`/api/admin/icon-families?${query}`, { method: 'DELETE' });
    if (response.ok) { setMessage(icon ? 'Ícone removido.' : 'Família removida.'); await loadFamilies(); if (family === selected) { setSelected(''); setIcons([]); } else if (selected) await loadIcons(selected); }
    setDeleteTarget(null);
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />;

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Famílias e ícones</h1>
      {(message || error) && <p className={`mb-4 p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{error || message}</p>}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 mb-5">
        <h2 className="font-medium text-zinc-900 dark:text-white mb-3">Nova família</h2>
        <form onSubmit={createFamily} className="flex flex-wrap gap-2">
          <input value={familyId} onChange={(e) => setFamilyId(e.target.value)} placeholder="id-da-familia" required className="flex-1 min-w-40 px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Nome da família" required className="flex-1 min-w-40 px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg"><FolderPlus className="w-4 h-4" />Criar</button>
        </form>
      </section>
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
          <h2 className="font-medium text-zinc-900 dark:text-white p-2">Famílias ({families.length})</h2>
           <div className="space-y-1">{families.map((family) => <div key={family.id} className={`flex items-center gap-2 rounded-lg ${selected === family.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}><button onClick={() => void loadIcons(family.id)} className="flex-1 text-left px-2 py-2"><span className="block text-sm text-zinc-800 dark:text-zinc-200">{family.name}</span><span className="text-xs text-zinc-400">{family.id} · {family.total} ícones</span></button><button onClick={() => setDeleteTarget({ family: family.id })} className="p-2 text-red-400 hover:text-red-600" title="Remover família"><Trash2 className="w-4 h-4" /></button></div>)}</div>
        </section>
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          {!selected ? <p className="text-sm text-zinc-400">Selecione uma família para gerenciar seus ícones.</p> : <>
            <h2 className="font-medium text-zinc-900 dark:text-white mb-3">Ícones de {selected}</h2>
            <form onSubmit={addIcon} className="space-y-2 mb-5"><div className="flex gap-2"><input value={iconName} onChange={(e) => setIconName(e.target.value)} placeholder="nome-do-icone" required className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800" /><input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="categorias, separadas, por vírgula" className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800" /></div><textarea value={svg} onChange={(e) => setSvg(e.target.value)} placeholder="Código SVG" required rows={7} className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-100 dark:bg-zinc-800" /><button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg"><Plus className="w-4 h-4" />Adicionar ícone</button></form>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {icons.map((icon) => (
                <div key={icon} className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-3 group">
                  <div className="h-24 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 mb-2">
                    <img src={`/icons/${encodeURIComponent(selected)}/${encodeURIComponent(icon)}.svg?v=${encodeURIComponent(manifestVersion)}`} alt={icon} className="w-3/4 h-3/4 object-contain" />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate pr-5" title={icon}>{icon}</p>
                   <button onClick={() => setDeleteTarget({ family: selected, icon })} className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 bg-white/80 dark:bg-zinc-900/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Remover ícone"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </>}
        </section>
       </div>
       <ConfirmDialog open={Boolean(deleteTarget)} title={deleteTarget?.icon ? 'Remover ícone' : 'Remover família'} description={deleteTarget?.icon ? `Remover o ícone ${deleteTarget.icon}? Esta ação não pode ser desfeita.` : `Remover toda a família ${deleteTarget?.family}? Esta ação não pode ser desfeita.`} confirmLabel="Remover" onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void remove(deleteTarget.family, deleteTarget.icon); }} />
     </div>
  );
}
