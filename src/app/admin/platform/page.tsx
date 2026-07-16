'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, Save } from 'lucide-react';

type Settings = {
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceContent: string;
  allowPublicSharing: boolean;
  defaultShareDuration: string;
};

const DEFAULTS: Settings = {
  siteName: '', contactEmail: '', maintenanceMode: false,
  maintenanceTitle: 'Plataforma em manutenção',
  maintenanceContent: '<p>Estamos realizando melhorias. Tente novamente em alguns minutos.</p>',
  allowPublicSharing: true, defaultShareDuration: '24h',
};

export default function PlatformPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [message, setMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch('/api/admin/platform', { cache: 'no-store' }).then((r) => r.json()).then((data) => {
        setSettings({ ...DEFAULTS, ...data });
        if (editorRef.current) editorRef.current.innerHTML = data.maintenanceContent || DEFAULTS.maintenanceContent;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    if (editorRef.current) setSettings((current) => ({ ...current, maintenanceContent: editorRef.current?.innerHTML || '' }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = editorRef.current?.innerHTML || settings.maintenanceContent;
    const response = await fetch('/api/admin/platform', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...settings, maintenanceContent: content }) });
    setMessage(response.ok ? 'Configurações salvas.' : 'Não foi possível salvar.');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Configuração da plataforma</h1>
      <form onSubmit={save} className="space-y-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="grid md:grid-cols-2 gap-3">
          <input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} placeholder="Nome da plataforma" className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm" />
          <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} placeholder="E-mail de contato" className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm" />
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3"><input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} /> Ativar modo manutenção</label>
          <input value={settings.maintenanceTitle} onChange={(e) => setSettings({ ...settings, maintenanceTitle: e.target.value })} placeholder="Título da manutenção" className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm mb-3" />
          <p className="text-xs text-zinc-500 mb-2">Mensagem exibida aos visitantes</p>
          <div className="flex gap-1 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-t-lg">
            <button type="button" onClick={() => command('bold')} className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Negrito"><Bold className="w-4 h-4" /></button>
            <button type="button" onClick={() => command('italic')} className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Itálico"><Italic className="w-4 h-4" /></button>
            <button type="button" onClick={() => command('formatBlock', 'h2')} className="px-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold">H2</button>
            <button type="button" onClick={() => command('insertUnorderedList')} className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Lista"><List className="w-4 h-4" /></button>
          </div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(event) => setSettings({ ...settings, maintenanceContent: event.currentTarget.innerHTML })} className="min-h-40 p-3 rounded-b-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 outline-none" />
        </div>
        <select value={settings.defaultShareDuration} onChange={(e) => setSettings({ ...settings, defaultShareDuration: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm"><option value="1h">1 hora</option><option value="24h">24 horas</option><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="never">Nunca expirar</option></select>
        <label className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={settings.allowPublicSharing} onChange={(e) => setSettings({ ...settings, allowPublicSharing: e.target.checked })} /> Permitir compartilhamentos públicos</label>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"><Save className="w-4 h-4" />Salvar</button>
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
}
