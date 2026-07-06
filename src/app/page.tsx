'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DropZone from '@/components/DropZone';
import FileCard from '@/components/FileCard';
import BatchActions from '@/components/BatchActions';
import { ImageFile, ImageFormat, CompressionOptions } from '@/lib/types';
import { compressImage } from '@/lib/image-processor';

interface CompressedResult {
  blob: Blob;
  url: string;
  format: ImageFormat;
}

export default function Home() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [results, setResults] = useState<Map<string, CompressedResult>>(new Map());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    // Revoke preview and compressed URLs to prevent memory leaks
    const file = files.find(f => f.id === id);
    if (file?.preview) URL.revokeObjectURL(file.preview);
    const result = results.get(id);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFiles(prev => prev.filter(f => f.id !== id));
    setResults(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, [files, results]);

  const handleCompress = useCallback(async (id: string, options: CompressionOptions) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    setProcessing(prev => new Set(prev).add(id));
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    try {
      const { blob, format } = await compressImage(file.file, options);
      const url = URL.createObjectURL(blob);

      setResults(prev => {
        const next = new Map(prev);
        // Revoke old URL if exists
        const old = next.get(id);
        if (old?.url) URL.revokeObjectURL(old.url);
        next.set(id, { blob, url, format });
        return next;
      });
    } catch (err) {
      setErrors(prev => {
        const next = new Map(prev);
        next.set(id, err instanceof Error ? err.message : 'Erro ao processar imagem');
        return next;
      });
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [files]);

  const handleCompressAll = useCallback(async (options: CompressionOptions) => {
    const pending = files.filter(
      f => !results.has(f.id) && !processing.has(f.id)
    );
    await Promise.all(pending.map(f => handleCompress(f.id, options)));
  }, [files, results, processing, handleCompress]);

  const handleDownloadAll = useCallback(() => {
    results.forEach((result, id) => {
      const file = files.find(f => f.id === id);
      if (!file) return;

      const link = document.createElement('a');
      link.href = result.url;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      link.download = `${baseName}_espremido.${result.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }, [results, files]);

  const handleClearAll = useCallback(() => {
    results.forEach((r) => {
      if (r.url) URL.revokeObjectURL(r.url);
    });
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setResults(new Map());
    setErrors(new Map());
    setProcessing(new Set());
  }, [files, results]);

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header />

      <main>
        {!hasFiles && <HeroSection />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Drop Zone */}
          <div className={hasFiles ? 'py-6' : ''}>
            <DropZone onFilesAdded={handleFilesAdded} />
          </div>

          {/* File List */}
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 space-y-4 max-w-2xl mx-auto"
            >
              {/* Batch Actions */}
              <BatchActions
                files={files}
                results={results}
                isProcessing={processing.size > 0}
                onCompressAll={handleCompressAll}
                onDownloadAll={handleDownloadAll}
                onClearAll={handleClearAll}
              />

              {/* Individual Files */}
              <AnimatePresence mode="popLayout">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    image={file}
                    onRemove={handleRemove}
                    onCompress={handleCompress}
                    compressedResult={results.get(file.id)}
                    isProcessing={processing.has(file.id)}
                    error={errors.get(file.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-400">
            Espremer — Processamento 100% no navegador. Nenhum dado é enviado para servidores.
          </p>
        </div>
      </footer>
    </div>
  );
}
