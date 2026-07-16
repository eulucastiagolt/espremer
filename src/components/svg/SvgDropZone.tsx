'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCode2 } from 'lucide-react';
import { isSvgFile } from '@/lib/utils';

export interface SvgLoadedFile {
  name: string;
  text: string;
  size: number;
}

interface SvgDropZoneProps {
  onSvgLoaded: (file: SvgLoadedFile) => void;
}

export default function SvgDropZone({ onSvgLoaded }: SvgDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    async (file: File) => {
      if (!isSvgFile(file)) {
        setError('Selecione um arquivo .svg válido.');
        return;
      }
      setError(null);
      const text = await file.text();
      onSvgLoaded({ name: file.name, text, size: file.size });
    },
    [onSvgLoaded],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await readFile(file);
    },
    [readFile],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await readFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [readFile],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-105'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }
        `}
      >
        <label htmlFor="svg-upload" className="sr-only">Selecionar SVG</label>
        <input
          ref={fileInputRef}
          id="svg-upload"
          type="file"
          accept="image/svg+xml,.svg"
          onChange={handleFileChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-blue-500">
                Solte seu SVG aqui
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <FileCode2 className="w-10 h-10 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-zinc-900 dark:text-white">
                  Arraste e solte seu SVG aqui
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  ou clique para selecionar um arquivo .svg
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                <FileCode2 className="w-4 h-4" />
                <span>SVG</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
      )}
    </motion.div>
  );
}
