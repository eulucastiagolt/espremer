'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface ResizableSplitProps {
  /** Painéis na ordem da esquerda para a direita. */
  panes: ReactNode[];
  /** Tamanho proporcional padrão de cada painel (qualquer escala positiva). */
  defaultSizes?: number[];
  /** Tamanho mínimo de cada painel em porcentagem do total. */
  minSizes?: number[];
  /** Chave de localStorage para persistir os tamanhos. */
  storageKey?: string;
  /** Breakpoint em px acima do qual o split horizontal é ativado. */
  desktopBreakpoint?: number;
}

/** Largura fixa de cada divisor em px. */
const DIVIDER_W = 6;

/**
 * Split horizontal redimensionável com N painéis e N-1 divisores
 * arrastáveis. Abaixo do breakpoint, empilha verticalmente.
 *
 * Os tamanhos são proporcionais (usados como flexGrow), então não
 * precisam somar 100 — apenas ser positivos.
 */
export default function ResizableSplit({
  panes,
  defaultSizes,
  minSizes,
  storageKey = 'espremer:svg-split',
  desktopBreakpoint = 1024,
}: ResizableSplitProps) {
  const count = panes.length;
  const mins = minSizes ?? Array(count).fill(15);
  const defs = defaultSizes ?? Array(count).fill(100 / count);

  const [sizes, setSizes] = useState<number[]>(defs);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  // Sync state from browser APIs after hydration (avoids SSR mismatch).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    // Restore saved sizes from localStorage.
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as number[];
        if (Array.isArray(parsed) && parsed.length === count && parsed.every((n) => n > 0)) {
          setSizes(parsed);
        }
      }
    } catch {
      /* ignore */
    }

    // Sync desktop breakpoint.
    setIsDesktop(window.matchMedia(`(min-width: ${desktopBreakpoint}px)`).matches);
  }, [storageKey, count, desktopBreakpoint]);

  // Listen for breakpoint changes.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${desktopBreakpoint}px)`);
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [desktopBreakpoint]);

  const handleDragStart = useCallback((index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(index);
  }, []);

  // Listeners globais durante o arraste de um divisor.
  useEffect(() => {
    if (dragging === null) return;

    const updateFromX = (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalDividerW = (count - 1) * DIVIDER_W;
      const availableW = rect.width - totalDividerW;
      if (availableW <= 0) return;

      const i = dragging;
      // Posição X ajustada (subtrai largura dos divisores à esquerda).
      const adjustedX = clientX - rect.left - i * DIVIDER_W;
      const fraction = Math.max(0, Math.min(1, adjustedX / availableW));

      setSizes((prev) => {
        const total = prev.reduce((a, b) => a + b, 0);
        const leftSum = prev.slice(0, i).reduce((a, b) => a + b, 0);
        const pairTotal = prev[i] + prev[i + 1];

        // fraction * total = leftSum + newSize_i
        let newSize_i = fraction * total - leftSum;
        // Constraints: min sizes como fração do total.
        const minI = (mins[i] / 100) * total;
        const minI1 = (mins[i + 1] / 100) * total;
        newSize_i = Math.max(minI, Math.min(pairTotal - minI1, newSize_i));

        const next = [...prev];
        next[i] = newSize_i;
        next[i + 1] = pairTotal - newSize_i;
        return next;
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateFromX(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        e.preventDefault();
        updateFromX(e.touches[0].clientX);
      }
    };
    const onEnd = () => {
      setDragging(null);
      setSizes((current) => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(current));
        } catch {
          /* ignore */
        }
        return current;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, count, mins, storageKey]);

  // Modo empilhado (mobile/tablet abaixo do breakpoint).
  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-4">
        {panes.map((pane, i) => (
          <div key={i}>{pane}</div>
        ))}
      </div>
    );
  }

  // Modo split horizontal (desktop) com N painéis e N-1 divisores.
  return (
    <div ref={containerRef} className="flex gap-0 h-[calc(100vh-12rem)] min-h-[420px]">
      {panes.map((pane, i) => (
        <Fragment key={i}>
          <div
            className="flex flex-col min-w-0 overflow-hidden"
            style={{ flexGrow: sizes[i], flexBasis: 0, flexShrink: 0 }}
          >
            {pane}
          </div>
          {i < count - 1 && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar painéis"
              onMouseDown={handleDragStart(i)}
              onTouchStart={handleDragStart(i)}
              className="relative flex-shrink-0 cursor-col-resize group z-10 px-2"
              style={{ flexBasis: `${DIVIDER_W}px`, flexGrow: 0, flexShrink: 0, touchAction: 'none' }}
            >
              <div
                className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${
                  dragging === i
                    ? 'bg-blue-500 w-0.5'
                    : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-blue-400'
                }`}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-blue-400 transition-colors" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
