'use client';

import { useCallback, useMemo, useState } from 'react';
import { Copy, Link2, Check, Image as ImageIcon } from 'lucide-react';

type DataUriMode = 'minified' | 'base64' | 'enc';

interface SvgDataUriProps {
  /** SVG otimizado atual. */
  optimized: string;
}

/* ── Data URI helpers ─────────────────────────────────────────────── */

/** Minified Data URI: data:image/svg+xml,<svg...> (sem escaping de URI). */
function toMinifiedDataUri(svg: string): string {
  const minified = svg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  return `data:image/svg+xml,${minified}`;
}

/** base64 Data URI: data:image/svg+xml;base64,<b64>. */
function toBase64DataUri(svg: string): string {
  // btoa precisa de Latin1; usamos TextEncoder + conversão para evitar
  // problemas com caracteres Unicode no SVG.
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}

/** encodeURIComponent Data URI: data:image/svg+xml,<encodeURIComponent(svg)>. */
function toEncDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const DATA_URI_MODES: { value: DataUriMode; label: string; fn: (s: string) => string; hint: string }[] = [
  { value: 'minified', label: 'Minified', fn: toMinifiedDataUri, hint: 'Compactado, sem escaping extra.' },
  { value: 'base64', label: 'Base64', fn: toBase64DataUri, hint: 'Maior, mas seguro para qualquer contexto.' },
  { value: 'enc', label: 'encodeURIComponent', fn: toEncDataUri, hint: 'URL-encodado, legível e portável.' },
];

export default function SvgDataUri({ optimized }: SvgDataUriProps) {
  const [copied, setCopied] = useState(false);
  const [uriMode, setUriMode] = useState<DataUriMode>('minified');

  const activeUri = DATA_URI_MODES.find((m) => m.value === uriMode)!;
  const dataUri = useMemo(
    () => (optimized ? activeUri.fn(optimized) : ''),
    [optimized, activeUri],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dataUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [dataUri]);

  return (
    <div className="p-4 space-y-3">
      {/* Seletor de modo */}
      <div className="flex items-center gap-1">
        {DATA_URI_MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setUriMode(m.value)}
            title={m.hint}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              uriMode === m.value
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {m.value === 'minified' && <Link2 className="w-3 h-3" />}
            {m.value === 'base64' && <ImageIcon className="w-3 h-3" />}
            {m.label}
          </button>
        ))}
      </div>

      {/* Preview da URI */}
      <div className="max-h-32 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 rounded-md p-2 border border-zinc-200 dark:border-zinc-800">
        <p className="font-mono text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 break-all">
          {optimized ? dataUri : '—'}
        </p>
      </div>

      <button
        onClick={handleCopy}
        disabled={!optimized}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Data URI copiada!' : `Copiar ${activeUri.label}`}
      </button>
    </div>
  );
}
