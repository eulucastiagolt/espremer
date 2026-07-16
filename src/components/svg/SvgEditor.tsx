'use client';

import { useCallback, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  Braces,
  Upload,
} from 'lucide-react';
import { highlightSvg } from '@/lib/prism';
import { isSvgFile } from '@/lib/utils';

interface SvgEditorProps {
  svg: string;
  onChange: (svg: string) => void;
  /** Opcional: notifica o parent quando um arquivo é dropado (para atualizar nome/size). */
  onFileDropped?: (name: string, text: string, size: number) => void;
}

/** Adiciona/atualiza o atributo `transform` no elemento <svg> root. */
function withRootTransform(svg: string, transform: string): string {
  const open = svg.match(/<svg\b[^>]*>/i);
  if (!open) return svg;

  const tag = open[0];
  const transformRe = /\btransform\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
  const m = tag.match(transformRe);

  let newTag: string;
  if (m) {
    const existing = m[1] ?? m[2] ?? '';
    newTag = tag.replace(transformRe, `transform="${existing} ${transform}"`);
  } else {
    newTag = tag.replace(/<svg\b/i, `<svg transform="${transform}"`);
  }

  return svg.replace(tag, newTag);
}

/** Aplica/ajusta width e height no <svg> root (em px). */
function withDimensions(svg: string, width: number, height: number): string {
  const open = svg.match(/<svg\b[^>]*>/i);
  if (!open) return svg;
  const tag = open[0];
  let newTag = tag
    .replace(/\swidth\s*=\s*(?:"[^"]*"|'[^']*')/i, ` width="${width}"`)
    .replace(/\sheight\s*=\s*(?:"[^"]*"|'[^']*')/i, ` height="${height}"`);
  if (!/\swidth\s*=/i.test(newTag)) newTag = newTag.replace(/<svg\b/i, `<svg width="${width}"`);
  if (!/\sheight\s*=/i.test(newTag)) newTag = newTag.replace(/<svg\b/i, `<svg height="${height}"`);
  return svg.replace(tag, newTag);
}

/**
 * Minifica um SVG: remove comentários, declarações XML redundantes e
 * espaços em branco entre tags. Não usa SVGO — é uma passada leve de
 * regex suficiente para o editor.
 */
export function minifySvg(svg: string): string {
  return svg
    // Remove declaração <?xml ... ?>
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    // Remove comentários <!-- ... -->
    .replace(/<!--[\s\S]*?-->/g, '')
    // Colapsa whitespace entre > e < (preserva conteúdo de text/style)
    .replace(/>\s+</g, '><')
    // Colapsa whitespace múltiplo dentro de tags para um espaço
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Formata (prettify) um SVG com indentação baseada em profundidade de tags.
 * Passada simples por regex — não é tão sofisticada quanto o SVGO, mas
 * cobre a maioria dos casos para visualização no editor.
 */
export function prettifySvg(svg: string): string {
  // Primeiro minifica para ter uma base limpa, depois reindenta.
  const minified = minifySvg(svg);
  if (!minified) return '';

  const tokens = minified
    // Quebra antes de cada tag
    .replace(/></g, '>\n<')
    .split('\n');

  let depth = 0;
  const lines: string[] = [];

  for (const raw of tokens) {
    const line = raw.trim();
    if (!line) continue;

    // Tag de fechamento: </...>
    if (line.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      lines.push('  '.repeat(depth) + line);
      continue;
    }

    // Self-closing: <.../>
    if (line.endsWith('/>') || (line.startsWith('<') && !line.startsWith('</') && /\/>$/.test(line))) {
      lines.push('  '.repeat(depth) + line);
      continue;
    }

    // Tag de abertura que não é self-closing e não é text puro
    if (line.startsWith('<') && !line.startsWith('</')) {
      lines.push('  '.repeat(depth) + line);
      // Se não for self-closing nem terminar com />, aumenta profundidade
      if (!line.endsWith('/>') && !line.endsWith('-->')) {
        depth++;
      }
      continue;
    }

    // Texto solto ou outra coisa
    lines.push('  '.repeat(depth) + line);
  }

  return lines.join('\n');
}

export default function SvgEditor({ svg, onChange, onFileDropped }: SvgEditorProps) {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  /** Extrai width e height do <svg> root (0 se não encontrado). */
  const dims = (() => {
    const tag = svg.match(/<svg\b[^>]*>/i)?.[0];
    if (!tag) return { w: 0, h: 0 };
    const w = parseFloat(tag.match(/\swidth\s*=\s*"?([^"\s]+)"?/i)?.[1] ?? '0') || 0;
    const h = parseFloat(tag.match(/\sheight\s*=\s*"?([^"\s]+)"?/i)?.[1] ?? '0') || 0;
    return { w, h };
  })();

  const handleDimChange = useCallback(
    (axis: 'w' | 'h', value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) return;
      const tag = svg.match(/<svg\b[^>]*>/i);
      if (!tag) return;
      if (axis === 'w') {
        onChange(withDimensions(svg, num, dims.h || num));
      } else {
        onChange(withDimensions(svg, dims.w || num, num));
      }
    },
    [svg, dims.w, dims.h, onChange],
  );

  const handleRotate = useCallback(() => {
    onChange(withRootTransform(svg, 'rotate(90)'));
  }, [svg, onChange]);

  const handleFlipX = useCallback(() => {
    onChange(withRootTransform(svg, 'scale(-1, 1)'));
  }, [svg, onChange]);

  const handleFlipY = useCallback(() => {
    onChange(withRootTransform(svg, 'scale(1, -1)'));
  }, [svg, onChange]);

  const handleNormalize = useCallback(() => {
    const open = svg.match(/<svg\b[^>]*>/i);
    if (!open) return;
    const tag = open[0];
    const vb = tag.match(/viewBox\s*=\s*"?([^"\s]+)\s+([^"\s]+)\s+([^"\s]+)\s+([^"\s]+)"?/i);
    if (vb) {
      const w = Math.round(parseFloat(vb[3]));
      const h = Math.round(parseFloat(vb[4]));
      if (w > 0 && h > 0) onChange(withDimensions(svg, w, h));
    }
  }, [svg, onChange]);

  const handleMinify = useCallback(() => {
    onChange(minifySvg(svg));
  }, [svg, onChange]);

  const handlePrettify = useCallback(() => {
    onChange(prettifySvg(svg));
  }, [svg, onChange]);

  /* ── Drag & drop de .svg direto no editor ─────────────────────── */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Necessário para permitir drop.
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (!isSvgFile(file)) return; // ignora silenciosamente não-SVG
      const text = await file.text();
      onChange(text);
      onFileDropped?.(file.name, text, file.size);
    },
    [onChange, onFileDropped],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden transition-colors flex flex-col h-full ${
        dragging
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Overlay de drag & drop */}
      {dragging && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-blue-500/5">
          <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-dashed border-blue-500 shadow-lg">
            <Upload className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Solte o .svg aqui
            </span>
          </div>
        </div>
      )}

      {/* Header com transformações + formatação */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex-wrap gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Editor
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {/* Transformações */}
          <button
            onClick={handleRotate}
            title="Girar 90°"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFlipX}
            title="Espelhar horizontal"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleFlipY}
            title="Espelhar vertical"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            onClick={handleNormalize}
            title="Igualar dimensões ao viewBox"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          {/* Dimensões */}
          <div className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min={0}
              value={dims.w || ''}
              onChange={(e) => handleDimChange('w', e.target.value)}
              placeholder="W"
              title="Largura (width)"
              className="w-14 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-center tabular-nums focus:border-blue-400 outline-none"
            />
            <span className="text-zinc-400">×</span>
            <input
              type="number"
              min={0}
              value={dims.h || ''}
              onChange={(e) => handleDimChange('h', e.target.value)}
              placeholder="H"
              title="Altura (height)"
              className="w-14 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-center tabular-nums focus:border-blue-400 outline-none"
            />
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          {/* Formatação */}
          <button
            onClick={handleMinify}
            title="Minificar código"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Minificar
          </button>
          <button
            onClick={handlePrettify}
            title="Formatar código (prettify)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Braces className="w-3.5 h-3.5" />
            Formatar
          </button>
        </div>
      </div>

      {/* Editor com syntax highlight — preenche a altura disponível */}
      <div className="code-highlight flex-1 overflow-auto">
        <Editor
          value={svg}
          onValueChange={onChange}
          highlight={highlightSvg}
          padding={16}
          placeholder="Cole ou edite o markup do SVG aqui…"
          textareaClassName="svg-editor-textarea"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            fontSize: 13,
            lineHeight: 1.6,
            minHeight: '100%',
            background: 'transparent',
            color: 'inherit',
          }}
        />
      </div>
    </div>
  );
}
