'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { svgToDataUri, formatBytes, calculateReduction } from '@/lib/utils';

interface SvgPreviewProps {
  /** SVG otimizado (ou editado) atual. */
  svg: string;
  /** SVG original para o toggle "mostrar original". */
  originalSvg: string;
  /** Tamanho em bytes do original. */
  originalSize?: number;
  /** Tamanho em bytes do otimizado. */
  optimizedSize?: number;
  /** Tamanho gzip do original (bytes), se disponível. */
  originalGzipSize?: number;
  /** Tamanho gzip do otimizado (bytes), se disponível. */
  optimizedGzipSize?: number;
  /** Erro do worker, se houver. */
  error?: string;
}

type BackgroundMode = 'checkered' | 'white' | 'light-gray' | 'black';

const BG_CONFIG: Record<BackgroundMode, { bg: string; pattern?: string }> = {
  checkered: {
    bg: '#fff',
    pattern:
      'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
  },
  white: { bg: '#ffffff' },
  'light-gray': { bg: '#f1f5f9' },
  black: { bg: '#18181b' },
};

/** Steps de zoom como multiplicador do tamanho intrínseco do SVG. */
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export default function SvgPreview({
  svg,
  originalSvg,
  originalSize,
  optimizedSize,
  originalGzipSize,
  optimizedGzipSize,
  error,
}: SvgPreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [bgMode, setBgMode] = useState<BackgroundMode>('checkered');
  const [zoomIndex, setZoomIndex] = useState(2); // 75% — tamanho inicial do preview

  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;

  const src = useMemo(
    () => svgToDataUri(showOriginal ? originalSvg : svg),
    [showOriginal, originalSvg, svg],
  );

  const isError = !svg || svg.trim() === '';
  const reduction =
    originalSize !== undefined && optimizedSize !== undefined
      ? calculateReduction(originalSize, optimizedSize)
      : undefined;
  const gzipReduction =
    originalGzipSize !== undefined && optimizedGzipSize !== undefined
      ? calculateReduction(originalGzipSize, optimizedGzipSize)
      : undefined;

  const bg = BG_CONFIG[bgMode];

  return (
    <div className="bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Preview
        </span>
        <div className="flex items-center gap-2">
          {/* Background selector */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {(Object.keys(BG_CONFIG) as BackgroundMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBgMode(mode)}
                title={
                  mode === 'checkered'
                    ? 'Quadriculado'
                    : mode === 'white'
                      ? 'Branco'
                      : mode === 'light-gray'
                        ? 'Cinza claro'
                        : 'Preto'
                }
                className={`w-5 h-5 rounded-md border transition-colors ${
                  bgMode === mode
                    ? 'border-blue-500 ring-1 ring-blue-500/30'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'
                }`}
                style={{
                  background:
                    mode === 'checkered'
                      ? 'conic-gradient(#f1f5f9 25%, #fff 25%, #fff 50%, #f1f5f9 50%, #f1f5f9 75%, #fff 75%)'
                      : mode === 'black'
                        ? '#18181b'
                        : mode === 'light-gray'
                          ? '#f1f5f9'
                          : '#fff',
                  backgroundSize: '8px 8px',
                }}
              />
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-10 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
               type="button"
               onClick={() => setZoomIndex(2)}
               disabled={zoomIndex === 2}
              className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              showOriginal
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}
            title="Alternar entre original e otimizado"
          >
            {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showOriginal ? 'Original' : 'Otimizado'}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 min-h-[220px] max-h-[58vh] flex items-center justify-center p-6 overflow-auto"
        style={{
          backgroundColor: bg.bg,
          backgroundImage: bg.pattern,
          backgroundSize: bg.pattern ? '20px 20px' : undefined,
          backgroundPosition: bg.pattern ? '0 0, 0 10px, 10px -10px, -10px 0' : undefined,
        }}
      >
        {isError ? (
          <p className="text-sm text-zinc-400">Sem conteúdo para visualizar.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Pré-visualização do SVG"
            className="object-contain"
            style={{
              maxWidth: zoom >= 1 ? 'none' : '100%',
              maxHeight: zoom >= 1 ? 'none' : '52vh',
              width: `${zoom * 100}%`,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
            }}
          />
        )}
      </div>

      {/* Métricas no rodapé do preview */}
      {(originalSize !== undefined || error) && (
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                {originalSize !== undefined && optimizedSize !== undefined && (
                  <>
                    {formatBytes(originalSize)} → {formatBytes(optimizedSize)}
                  </>
                )}
              </span>
              {reduction !== undefined && (
                <span className={reduction > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}>
                  {reduction > 0 ? `−${reduction}%` : `+${Math.abs(reduction)}%`}
                </span>
              )}
              {originalGzipSize !== undefined && optimizedGzipSize !== undefined && (
                <span className="font-mono text-zinc-400">
                  gzip: {formatBytes(originalGzipSize)} → {formatBytes(optimizedGzipSize)}
                  {gzipReduction !== undefined && (
                    <span className={gzipReduction > 0 ? 'text-green-600 dark:text-green-400 ml-1' : 'text-orange-500 ml-1'}>
                      {gzipReduction > 0 ? `−${gzipReduction}%` : `+${Math.abs(gzipReduction)}%`}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
