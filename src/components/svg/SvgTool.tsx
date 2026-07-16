'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  Eraser,
  FileCode2,
  Upload,
  Sparkles,
  Download,
  Settings2,
  Check,
  Copy,
  FileImage,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Link2,
  Code2,
  Library,
  Share2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import SvgEditor from './SvgEditor';
import SvgPreview from './SvgPreview';
import SvgOptimizationPanel from './SvgOptimizationPanel';
import SvgDataUri from './SvgDataUri';
import IconLibrary from './IconLibrary';
import ShareDialog from './ShareDialog';
import Dropdown, { DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import ResizableSplit from '@/components/ui/ResizableSplit';
import { isSvgFile } from '@/lib/utils';
import {
  SVG_DEFAULT_CONFIG,
  type SvgOptimizationConfig,
  type SvgOptimizeResult,
  type SvgWorkerRequest,
  type SvgWorkerResponse,
} from '@/lib/svg-types';
import type { SvgLoadedFile } from './SvgDropZone';

/** Logo do Espremer como SVG de exemplo (gota sobre gradiente azul→roxo). */
const DEMO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="espremer-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6" />
      <stop offset="1" stop-color="#9333ea" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="44" fill="url(#espremer-grad)" />
  <g transform="translate(100 100) scale(5.5) translate(-12 -12)" fill="#ffffff">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </g>
</svg>`;

/** Arquivo de exemplo usado para inicializar o editor (não vazio ao carregar). */
const DEMO_FILE: SvgLoadedFile = {
  name: 'espremer-logo.svg',
  text: DEMO_SVG,
  size: new Blob([DEMO_SVG]).size,
};

/**
 * Hook para detectar mobile via media query.
 * Usa useSyncExternalStore para evitar hydration mismatch e lint warnings.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

type MobileTab = 'editor' | 'preview' | 'icons';

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Code2 }[] = [
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'icons', label: 'Ícones', icon: Library },
];

export default function SvgTool() {
  // Input state — inicia com o SVG de exemplo para o editor não nascer vazio.
  const [input, setInput] = useState<SvgLoadedFile | null>(DEMO_FILE);
  /** SVG editado pelo usuário (live editing). */
  const [edited, setEdited] = useState<string>(DEMO_SVG);

  // Config
  const [config, setConfig] = useState<SvgOptimizationConfig>(SVG_DEFAULT_CONFIG);

  // Result
  const [result, setResult] = useState<SvgOptimizeResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // Estado de UI: copiar código.
  const [copiedCode, setCopiedCode] = useState(false);
  // PNG busy.
  const [pngBusy, setPngBusy] = useState(false);
  // Colapsar painel de otimização dentro da coluna de ícones.
  const [showOptPanel, setShowOptPanel] = useState(false);
  // Share dialog.
  const [showShare, setShowShare] = useState(false);

  // Mobile tab.
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Worker
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);
  const pendingRef = useRef<Map<number, (r: SvgOptimizeResult) => void>>(new Map());

  /**
   * Guarda o último input enviado ao worker. Usado para evitar
   * re-otimizar quando o editor já contém o mesmo conteúdo.
   */
  const lastInputRef = useRef<string>(DEMO_SVG);
  /** Hash da última config usada no worker — muda a cada alteração de config. */
  const lastConfigHashRef = useRef<string>('');

  // File input oculto para o botão "Abrir".
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** True quando há otimização ativa (preset ≠ off ou plugins habilitados). */
  const hasActiveOptimization = useMemo(
    () => config.preset !== 'off' || config.plugins.some((t) => t.enabled),
    [config.preset, config.plugins],
  );

  /** Hash da config para detectar mudanças (string estable). */
  const configHash = useMemo(
    () => JSON.stringify({ p: config.preset, mp: config.multipass, fp: config.floatPrecision, pr: config.pretty, pl: config.plugins }),
    [config],
  );

  useEffect(() => {
    const worker = new Worker(new URL('@/lib/svgo.worker.ts', import.meta.url));
    worker.onmessage = (e: MessageEvent<SvgWorkerResponse>) => {
      const { id, result } = e.data;
      const resolve = pendingRef.current.get(id);
      if (resolve) {
        resolve(result);
        pendingRef.current.delete(id);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /**
   * Otimiza o SVG atual via worker. Apenas atualiza o estado `result`
   * (usado pelo preview/download). NÃO espelha de volta no editor —
   * o editor sempre mostra o código que o usuário escreveu/editou.
   */
  const optimizeNow = useCallback(
    async (svg: string, cfg: SvgOptimizationConfig) => {
      if (!workerRef.current || !svg) {
        return;
      }
      setOptimizing(true);
      const id = ++reqIdRef.current;
      const req: SvgWorkerRequest = { id, svg, config: cfg };
      const promise = new Promise<SvgOptimizeResult>((resolve) => {
        pendingRef.current.set(id, resolve);
      });
      workerRef.current.postMessage(req);
      // Race com um timeout de segurança (30s).
      const r = await Promise.race([
        promise,
        new Promise<SvgOptimizeResult>((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: svg,
                optimizedSize: new Blob([svg]).size,
                originalSize: new Blob([svg]).size,
                error: 'Timeout',
              }),
            30000,
          ),
        ),
      ]);
      // Só atualiza se for a requisição mais recente.
      if (id === reqIdRef.current) {
        setResult(r);
        setOptimizing(false);
        lastInputRef.current = svg;
        lastConfigHashRef.current = configHash;
      }
    },
    [],
  );

  // Reotimiza quando o SVG editado ou a config mudam (debounce 300ms).
  // Pula se já otimizou exatamente este conteúdo com esta config.
  useEffect(() => {
    if (!edited) return;
    const inputChanged = edited !== lastInputRef.current;
    const configChanged = configHash !== lastConfigHashRef.current;
    if (!inputChanged && !configChanged) return;
    const t = setTimeout(() => {
      void optimizeNow(edited, config);
    }, 300);
    return () => clearTimeout(t);
  }, [edited, configHash, optimizeNow, config]);

  const handleSvgLoaded = useCallback((file: SvgLoadedFile) => {
    setInput(file);
    setEdited(file.text);
    setResult(null);
    reqIdRef.current += 1;
    lastInputRef.current = '';
  }, []);

  const handleDemo = useCallback(() => {
    setInput(DEMO_FILE);
    setEdited(DEMO_SVG);
    setResult(null);
    reqIdRef.current += 1;
    lastInputRef.current = '';
  }, []);

  const handleClear = useCallback(() => {
    setInput(null);
    setEdited('');
    setResult(null);
    setOptimizing(false);
    lastInputRef.current = '';
  }, []);

  /** Ícone escolhido na biblioteca — carrega no editor. */
  const handlePickIcon = useCallback(
    (svg: string, name: string) => {
      setInput({ name, text: svg, size: new Blob([svg]).size });
      setEdited(svg);
      setResult(null);
      reqIdRef.current += 1;
      lastInputRef.current = '';
      if (isMobile) setMobileTab('editor');
    },
    [isMobile],
  );

  /** Arquivo dropado no editor (notificação do SvgEditor). */
  const handleFileDropped = useCallback((name: string, text: string, size: number) => {
    setInput({ name, text, size });
    setEdited(text);
    setResult(null);
    reqIdRef.current += 1;
    lastInputRef.current = '';
  }, []);

  // Abrir arquivo via botão (input oculto).
  const handleOpenClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isSvgFile(file)) {
        const text = await file.text();
        handleSvgLoaded({ name: file.name, text, size: file.size });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleSvgLoaded],
  );

  const baseName = useMemo(() => {
    if (!input) return 'svg';
    return input.name.replace(/\.[^.]+$/, '') || 'svg';
  }, [input]);

  const hasInput = edited.length > 0;

  // SVG exibido (otimizado se disponível, senão o editado).
  const optimized = result?.data ?? edited;
  const originalSize = result?.originalSize ?? (input?.size ?? new Blob([edited]).size);
  const optimizedSize = result?.optimizedSize ?? new Blob([edited]).size;

  /* ── Ações de exportação ──────────────────────────────────────── */

  const handleDownloadSvg = useCallback(() => {
    const blob = new Blob([optimized], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `${baseName}_espremido.svg`);
  }, [optimized, baseName]);

  const handleDownloadPng = useCallback(async () => {
    if (!optimized) return;
    setPngBusy(true);
    try {
      const uri = `data:image/svg+xml,${encodeURIComponent(optimized)}`;
      const img = new window.Image();
      const wMatch = optimized.match(/<svg[^>]*\swidth\s*=\s*"([^"]+)"/i);
      const hMatch = optimized.match(/<svg[^>]*\sheight\s*=\s*"([^"]+)"/i);
      const vbMatch = optimized.match(/viewBox\s*=\s*"([^"]+)"/i);
      let w = wMatch ? parseFloat(wMatch[1]) : 0;
      let h = hMatch ? parseFloat(hMatch[1]) : 0;
      if ((!w || !h) && vbMatch) {
        const parts = vbMatch[1].split(/[\s,]+/).map(Number);
        w = w || parts[2] || 0;
        h = h || parts[3] || 0;
      }
      w = w || 300;
      h = h || 150;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar SVG para raster.'));
        img.src = uri;
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w));
      canvas.height = Math.max(1, Math.round(h));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D não disponível.');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) saveAs(blob, `${baseName}.png`);
          resolve();
        }, 'image/png');
      });
    } catch {
      /* ignore */
    } finally {
      setPngBusy(false);
    }
  }, [optimized, baseName]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(optimized);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      /* ignore */
    }
  }, [optimized]);

  /* ── Content shared between desktop and mobile ────────────────── */

  const iconsPane = (
    <div
      key="icons"
      className="bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full border border-zinc-100 dark:border-zinc-800 rounded-xl"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Ícones</span>
      </div>
      <div className="flex-1 overflow-auto p-4 min-h-0">
        <IconLibrary onPickIcon={handlePickIcon} />
      </div>
      <div className="border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <button
          onClick={() => setShowOptPanel((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Otimização (SVGO)
          </span>
          {showOptPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        {showOptPanel && (
          <div className="max-h-72 overflow-y-auto border-t border-zinc-100 dark:border-zinc-800">
            <SvgOptimizationPanel config={config} onChange={setConfig} embedded />
          </div>
        )}
      </div>
    </div>
  );

  const previewPane = (
    <div
      key="preview"
      className="bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full border border-zinc-100 dark:border-zinc-800 rounded-xl"
    >
      <PreviewPanel
        optimized={optimized}
        originalSvg={input?.text ?? edited}
        originalSize={originalSize}
        optimizedSize={optimizedSize}
        originalGzipSize={result?.originalGzipSize}
        optimizedGzipSize={result?.optimizedGzipSize}
        error={result?.error}
      />
    </div>
  );

  const editorPane = (
    <motion.div
      key="editor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <SvgEditor
        svg={edited}
        onChange={setEdited}
        onFileDropped={handleFileDropped}
      />
    </motion.div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,.svg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top bar: título + ações */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
            Otimizador &amp; Editor de SVG
          </h2>
          {optimizing && (
            <span className="text-xs text-blue-500 animate-pulse">otimizando…</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Abrir SVG
          </button>

          {/* Dropdown: Baixar */}
          <Dropdown
            trigger={
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Baixar
              </span>
            }
            menuClassName="w-48"
            align="right"
          >
            <DropdownItem onClick={handleDownloadSvg} icon={<FileCode2 className="w-3.5 h-3.5" />}>
              Baixar SVG
            </DropdownItem>
            <DropdownItem
              onClick={handleDownloadPng}
              icon={pngBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5" />}
              disabled={pngBusy || !optimized}
            >
              {pngBusy ? 'Gerando PNG…' : 'Baixar PNG'}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              onClick={handleCopyCode}
              icon={copiedCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedCode ? 'Código copiado!' : 'Copiar código'}
            </DropdownItem>
          </Dropdown>

          {hasInput && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar
            </button>
          )}

          {!hasInput && (
            <button
              onClick={handleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Exemplo
            </button>
          )}
          {hasInput && (
            <>
              {input && (
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-[40vw] truncate">
                  <FileCode2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{input.name}</span>
                </span>
              )}
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                Limpar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile: tabs ──────────────────────────────────────────── */}
      {isMobile ? (
        <div className="flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 mb-4 -mx-1">
            {MOBILE_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setMobileTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                    mobileTab === t.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="min-h-[60vh]">
            {mobileTab === 'editor' && (
              <div className="h-[60vh]">{editorPane}</div>
            )}
            {mobileTab === 'preview' && (
              <div className="min-h-[60vh]">{previewPane}</div>
            )}
            {mobileTab === 'icons' && (
              <div className="min-h-[60vh]">{iconsPane}</div>
            )}
          </div>
        </div>
      ) : (
        /* ── Desktop: 3 colunas redimensionáveis ────────────────── */
        <ResizableSplit
          storageKey="espremer:svg-split-3"
          defaultSizes={[22, 36, 42]}
          minSizes={[16, 22, 24]}
          panes={[iconsPane, editorPane, previewPane]}
        />
      )}

      {/* Share dialog */}
      {showShare && edited && (
        <ShareDialog
          svg={optimized}
          name={input?.name || 'icon.svg'}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

/* ── Sub-painel: Preview com abas Preview / Data URI ──────────────── */

type PreviewTab = 'preview' | 'data-uri';

function PreviewPanel({
  optimized,
  originalSvg,
  originalSize,
  optimizedSize,
  originalGzipSize,
  optimizedGzipSize,
  error,
}: {
  optimized: string;
  originalSvg: string;
  originalSize: number;
  optimizedSize: number;
  originalGzipSize?: number;
  optimizedGzipSize?: number;
  error?: string;
}) {
  const [tab, setTab] = useState<PreviewTab>('preview');

  const TABS: { id: PreviewTab; label: string; icon: typeof Eye }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'data-uri', label: 'Data URI', icon: Link2 },
  ];

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto min-h-0">
        {tab === 'preview' && (
          <SvgPreview
            svg={optimized}
            originalSvg={originalSvg}
            originalSize={originalSize}
            optimizedSize={optimizedSize}
            originalGzipSize={originalGzipSize}
            optimizedGzipSize={optimizedGzipSize}
            error={error}
          />
        )}
        {tab === 'data-uri' && <SvgDataUri optimized={optimized} />}
      </div>
    </>
  );
}
