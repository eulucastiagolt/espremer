'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatBytes } from '@/lib/utils';

interface ImageComparisonSliderProps {
  originalSrc: string;
  compressedSrc: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
  originalDimensions?: { width: number; height: number };
}

export default function ImageComparisonSlider({
  originalSrc,
  compressedSrc,
  originalName,
  originalSize,
  compressedSize,
  originalDimensions,
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const reduction = Math.round((1 - compressedSize / originalSize) * 100);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSliderPosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updateSliderPosition(e.touches[0].clientX);
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateSliderPosition]);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      {/* Labels */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-zinc-400" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Original</span>
          <span className="text-xs text-zinc-400">{formatBytes(originalSize)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Comprimido</span>
          <span className="text-xs text-zinc-400">{formatBytes(compressedSize)} ({reduction}% menor)</span>
        </div>
      </div>

      {/* Slider Container */}
      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden max-h-[70vh]"
        style={{ cursor: isDragging ? 'col-resize' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Compressed Image (background) */}
        <img
          src={compressedSrc}
          alt={`${originalName} - comprimido`}
          className="w-full h-auto block max-h-[70vh] object-contain"
          draggable={false}
        />

        {/* Original Image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={originalSrc}
            alt={`${originalName} - original`}
            className="w-full h-auto block max-h-[70vh] object-contain"
            draggable={false}
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Vertical Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]" />

          {/* Handle Circle */}
          <div
            role="slider"
            aria-label="Comparar imagens: arraste para ver original vs comprimido"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setSliderPosition(prev => Math.max(0, prev - 2));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setSliderPosition(prev => Math.min(100, prev + 2));
              }
            }}
            className="absolute top-1/2 left-1/2 
              w-10 h-10 rounded-full bg-white shadow-lg border-2 border-zinc-200 
              flex items-center justify-center outline-none"
            style={{ 
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
              boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            {/* Left arrow */}
            <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {/* Right arrow */}
            <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

      </div>

      {/* Dimensions info */}
      {originalDimensions && (
        <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 text-center">
            {originalDimensions.width} × {originalDimensions.height} px
          </p>
        </div>
      )}
    </div>
  );
}
