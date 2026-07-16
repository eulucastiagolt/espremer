'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Code2,
  FilePlus2,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { readResponseJson } from '@/lib/read-response-json';
import { optimize } from 'svgo/browser';
import SvgPreview from '@/components/svg/SvgPreview';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Icon = { id: string; name: string; status: string; rejectionReason?: string | null; createdAt: string };

const STATUS = {
  pending: { label: 'Em análise', icon: Clock3, className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' },
  approved: { label: 'Publicado', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300' },
  rejected: { label: 'Recusado', icon: XCircle, className: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' },
} as const;

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [icons, setIcons] = useState<Icon[]>([]);
  const [emailVerified, setEmailVerified] = useState(true);
  const [name, setName] = useState('');
  const [svg, setSvg] = useState('');
  const [originalSvg, setOriginalSvg] = useState('');
  const [svgError, setSvgError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const validateSvg = (value: string) => {
    const clean = value.trim().replace(/^\uFEFF/, '');
    if (!/<svg\b[^>]*>/i.test(clean) || !/<\/svg\s*>/i.test(clean)) return 'O conteúdo precisa conter as tags <svg> e </svg>.';
    return null;
  };

  const applySvg = (value: string) => {
    const clean = value.trim().replace(/^\uFEFF/, '');
    const validationError = clean ? validateSvg(clean) : null;
    if (validationError) { setSvg(clean); setOriginalSvg(clean); setSvgError(validationError); return; }
    if (!clean) { setSvg(''); setOriginalSvg(''); setSvgError(null); return; }
    try {
      const document = new DOMParser().parseFromString(clean, 'image/svg+xml');
      if (document.querySelector('parsererror')) throw new Error('SVG inválido');
      document.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
      document.querySelectorAll('*').forEach((node) => Array.from(node.attributes).forEach((attribute) => {
        if (attribute.name.toLowerCase().startsWith('on') || /javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
      }));
      const sanitized = new XMLSerializer().serializeToString(document.documentElement);
      const optimized = optimize(sanitized, { plugins: ['preset-default'] }).data;
      setOriginalSvg(sanitized); setSvg(optimized); setSvgError(null);
    } catch { setSvg(clean); setOriginalSvg(clean); setSvgError('Não foi possível processar este SVG.'); }
  };

  const readSvgFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setSvgError('Selecione um arquivo .svg.');
      return;
    }
    applySvg(await file.text());
  };

  const loadIcons = async () => {
    const response = await fetch('/api/community/icons', { cache: 'no-store' });
    if (response.ok) { const data = await readResponseJson<{ icons?: Icon[]; account?: { emailVerified?: boolean } }>(response); setIcons(data.icons || []); setEmailVerified(data.account?.emailVerified !== false); }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    const timer = window.setTimeout(() => void loadIcons(), 0);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === 'loading') return <div className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-400">Carregando área da comunidade...</div>;

  if (status !== 'authenticated') {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-3">Espremer Community</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Seu espaço para criar e compartilhar ícones.</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Hospede seus SVGs, acompanhe a revisão e ajude a construir uma biblioteca aberta e cuidadosa.</p>
          <div className="flex items-center justify-center gap-3 mt-7">
            <a href="/community/login" className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium">Entrar</a>
            <a href="/community/register" className="px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-medium">Criar conta</a>
          </div>
        </div>
      </main>
    );
  }

  const sessionRole = (session.user as { role?: string }).role;
  if (sessionRole !== 'community') {
    return <main className="min-h-[70vh] flex items-center justify-center px-4"><div className="max-w-md text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8"><ShieldCheck className="w-10 h-10 text-blue-500 mx-auto mb-4" /><h1 className="text-xl font-bold text-zinc-900 dark:text-white">Conta da comunidade necessária</h1><p className="text-sm text-zinc-500 mt-2">Sua sessão atual pertence ao painel administrativo. Crie ou acesse uma conta específica da comunidade para enviar ícones.</p><div className="flex justify-center gap-3 mt-6"><a href="/community/register" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Criar conta</a><button onClick={() => void signOut({ callbackUrl: '/community/login' })} className="px-4 py-2 border rounded-lg text-sm text-zinc-600 dark:text-zinc-300">Trocar conta</button></div></div></main>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setMessage(null);
    const response = await fetch('/api/community/icons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, svg, acceptedPolicies: accepted }) });
    const data = await readResponseJson<{ error?: string }>(response);
    if (!response.ok) setMessage({ text: data.error || 'Não foi possível enviar o ícone.', error: true });
    else { setMessage({ text: 'Ícone enviado. Ele ficará disponível após a análise da equipe.' }); setName(''); setSvg(''); setOriginalSvg(''); setSvgError(null); setAccepted(false); await loadIcons(); }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/community/icons?id=${id}`, { method: 'DELETE' });
    if (response.ok) setIcons((current) => current.filter((icon) => icon.id !== id));
    setDeleteTarget(null);
  };

  const pending = icons.filter((icon) => icon.status === 'pending').length;
  const approved = icons.filter((icon) => icon.status === 'approved').length;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-2">Área do criador</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Olá, {session.user?.name?.split(' ')[0] || 'criador'}.</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Gerencie seus envios e acompanhe o processo de publicação.</p>
          </div>
          <button onClick={() => void signOut({ callbackUrl: '/community/login' })} className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900"><LogOut className="w-4 h-4" />Sair</button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"><p className="text-xs text-zinc-400">Total enviado</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{icons.length}</p></div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"><p className="text-xs text-zinc-400">Em análise</p><p className="text-2xl font-bold text-amber-500 mt-1">{pending}</p></div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"><p className="text-xs text-zinc-400">Publicados</p><p className="text-2xl font-bold text-emerald-500 mt-1">{approved}</p></div>
          <div className="bg-blue-600 rounded-xl p-4 text-white"><ShieldCheck className="w-5 h-5 mb-2 text-blue-200" /><p className="text-xs text-blue-100">Revisão responsável</p><p className="text-xs mt-1 text-blue-50">Cada envio é avaliado antes de aparecer.</p></div>
        </div>
        {!emailVerified && <div className="flex items-start gap-3 mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"><AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /><div><p className="text-sm font-semibold text-amber-800 dark:text-amber-200">E-mail ainda não confirmado</p><p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Confirme seu e-mail para liberar o envio e a publicação de ícones.</p></div></div>}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FilePlus2 className="w-4 h-4 text-blue-500" /></div><div><h2 className="font-semibold text-zinc-900 dark:text-white">Enviar novo ícone</h2><p className="text-xs text-zinc-400">SVG limpo, original e dentro das políticas</p></div></div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div><label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nome do ícone</label><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="ex.: Aurora" className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400" /></div>
              <div>
                <div className="flex items-center justify-between mb-1.5"><label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Código SVG</label><span className="text-[11px] text-zinc-400 inline-flex items-center gap-1"><Code2 className="w-3 h-3" />Cole, selecione ou arraste</span></div>
                <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void readSvgFile(file); }} className={`rounded-lg border-2 border-dashed transition-colors ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : svgError ? 'border-red-300' : 'border-zinc-700'}`}>
                  <textarea required value={svg} onChange={(event) => applySvg(event.target.value)} onPaste={(event) => { event.preventDefault(); applySvg(event.clipboardData.getData('text')); }} placeholder="<svg ...>...</svg>" rows={10} className="w-full px-3 py-3 text-xs font-mono leading-5 bg-zinc-950 text-zinc-200 rounded-t-lg outline-none resize-y" />
                  <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded-b-lg"><span className="text-[11px] text-zinc-500">{dragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo SVG para esta área'}</span><button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300">Selecionar arquivo</button><input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readSvgFile(file); event.currentTarget.value = ''; }} /></div>
                </div>
                {svgError && <p className="text-xs text-red-500 mt-1.5">{svgError}</p>}
                 <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                   <SvgPreview
                     svg={svg}
                     originalSvg={originalSvg}
                     originalSize={originalSvg ? new Blob([originalSvg]).size : undefined}
                     optimizedSize={svg ? new Blob([svg]).size : undefined}
                     error={svgError || undefined}
                   />
                 </div>
              </div>
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 text-xs leading-5 text-amber-800 dark:text-amber-200"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required className="mt-1" /><span>Confirmo que sou responsável pelo conteúdo, possuo os direitos necessários e aceito as políticas da plataforma. Envios inadequados podem ser removidos e a conta pode ser suspensa.</span></label>
              {message && <p className={`text-sm p-3 rounded-lg ${message.error ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>{message.text}</p>}
              <button disabled={submitting || Boolean(svgError) || !svg.trim()} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? 'Enviando...' : 'Enviar para análise'}</button>
            </form>
          </section>

           <aside className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"><div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800"><h2 className="font-semibold text-zinc-900 dark:text-white">Meus envios</h2><p className="text-xs text-zinc-400 mt-1">Histórico e status dos seus ícones</p></div><div className="p-3 space-y-2 max-h-[540px] overflow-y-auto">{icons.length === 0 ? <div className="py-10 text-center text-sm text-zinc-400">Você ainda não enviou ícones.</div> : icons.map((icon) => { const config = STATUS[icon.status as keyof typeof STATUS] || STATUS.pending; const StatusIcon = config.icon; return <div key={icon.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400"><Sparkles className="w-4 h-4" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate text-zinc-800 dark:text-zinc-200">{icon.name}</p><p className="text-[11px] text-zinc-400">{new Date(icon.createdAt).toLocaleDateString('pt-BR')}</p></div><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${config.className}`}><StatusIcon className="w-3 h-3" />{config.label}</span>{icon.status !== 'approved' && <button onClick={() => setDeleteTarget(icon.id)} title="Remover envio" className="p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}</div>{icon.status === 'rejected' && icon.rejectionReason && <p className="mt-2 text-xs text-red-600 dark:text-red-300">Motivo: {icon.rejectionReason}</p>}</div>; })}</div></aside>
       </div>
       <ConfirmDialog open={Boolean(deleteTarget)} title="Remover ícone" description="Remover este ícone da sua conta? Esta ação não pode ser desfeita." confirmLabel="Remover" onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void remove(deleteTarget); }} />
        <div className="flex items-start gap-2 mt-6 text-xs leading-5 text-zinc-400"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><p>A comunidade é colaborativa. Não envie marcas, obras protegidas ou conteúdo malicioso sem autorização. A equipe pode moderar ou remover conteúdo que viole as regras.</p></div>
      </div>
    </main>
  );
}
