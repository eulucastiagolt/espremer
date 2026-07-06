'use client';

import { motion } from 'framer-motion';
import { Download, Trash2, Loader2, Zap } from 'lucide-react';
import { CompressionOptions, ImageFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface BatchActionsProps {
  files: ImageFile[];
  results: Map<string, { blob: Blob; url: string }>;
  isProcessing: boolean;
  onCompressAll: (options: CompressionOptions) => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
}

export default function BatchActions({
  files,
  results,
  isProcessing,
  onCompressAll,
  onDownloadAll,
  onClearAll,
}: BatchActionsProps) {
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalCompressedSize = Array.from(results.values()).reduce(
    (sum, r) => sum + r.blob.size,
    0
  );
  const compressionRatio =
    totalOriginalSize > 0
      ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
      : 0;

  const allCompressed = results.size === files.length && files.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              {files.length} arquivo{files.length !== 1 && 's'}
            </span>
            {allCompressed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`font-medium ${
                  compressionRatio > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-500'
                }`}
              >
                {compressionRatio > 0
                  ? `-${compressionRatio}% total`
                  : `+${Math.abs(compressionRatio)}% total`}
              </motion.span>
            )}
          </div>
          <div className="text-zinc-400 text-xs">
            {formatBytes(totalOriginalSize)}
            {allCompressed && (
              <>
                {' → '}
                <span className={compressionRatio > 0 ? 'text-green-500' : 'text-orange-500'}>
                  {formatBytes(totalCompressedSize)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!allCompressed && (
            <button
              onClick={() =>
                onCompressAll({
                  quality: 75,
                  format: 'auto',
                })
              }
              disabled={isProcessing || files.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Espremer Todos
            </button>
          )}

          {allCompressed && (
            <button
              onClick={onDownloadAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar Todos
            </button>
          )}

          <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
