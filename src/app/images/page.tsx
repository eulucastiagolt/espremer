'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import DropZone from '@/components/DropZone';
import FileCard from '@/components/FileCard';
import BatchActions from '@/components/BatchActions';
import JSZip from 'jszip';
import { ImageFile, ImageFormat, CompressionOptions } from '@/lib/types';
import { compressImage } from '@/lib/image-processor';

interface CompressedResult {
  blob: Blob;
  url: string;
  format: ImageFormat;
}

export default function ImagesPage() {
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

  const handleRecompressAll = useCallback(async (options: CompressionOptions) => {
    // Clear all old results first
    results.forEach((r) => {
      if (r.url) URL.revokeObjectURL(r.url);
    });
    setResults(new Map());
    setErrors(new Map());

    // Re-compress all files
    await Promise.all(files.map(f => handleCompress(f.id, options)));
  }, [files, results, handleCompress]);

  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip();
    results.forEach((result, id) => {
      const file = files.find(f => f.id === id);
      if (!file) return;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      zip.file(`${baseName}_espremido.${result.format}`, result.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'espremidos.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
      {!hasFiles && <HeroSection />}

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
            onRecompressAll={handleRecompressAll}
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
  );
}
