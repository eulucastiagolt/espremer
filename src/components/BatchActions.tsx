'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Loader2, Zap, Settings, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react';
import { CompressionOptions, ImageFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface BatchActionsProps {
  files: ImageFile[];
  results: Map<string, { blob: Blob; url: string }>;
  isProcessing: boolean;
  onCompressAll: (options: CompressionOptions) => void;
  onRecompressAll: (options: CompressionOptions) => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
}

export default function BatchActions({
  files,
  results,
  isProcessing,
  onCompressAll,
  onRecompressAll,
  onDownloadAll,
  onClearAll,
}: BatchActionsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<'quality' | 'targetSize'>('quality');
  const [quality, setQuality] = useState(75);
  const [targetSizeMB, setTargetSizeMB] = useState(1);
  const [format, setFormat] = useState<CompressionOptions['format']>('auto');

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
  const compressedCount = results.size;

  const buildOptions = (): CompressionOptions => ({
    quality,
    format,
    ...(mode === 'targetSize'
      ? { targetSizeBytes: Math.round(targetSizeMB * 1024 * 1024) }
      : {}),
  });

  const settingsPanel = (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-3 space-y-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('quality')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'quality'
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Qualidade
              </button>
              <button
                onClick={() => setMode('targetSize')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'targetSize'
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Tamanho Alvo
              </button>
            </div>

            {mode === 'quality' ? (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Qualidade: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Tamanho desejado (MB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={targetSizeMB}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v > 0) setTargetSizeMB(v);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                  />
                  <span className="text-xs text-zinc-400">MB</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Formato de Saída
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as CompressionOptions['format'])}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <option value="auto">Automático</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="avif">AVIF</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 dark:text-zinc-400">
              {files.length} arquivo{files.length !== 1 && 's'}
            </span>

            {/* Progress during compression */}
            {isProcessing && !allCompressed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {compressedCount}/{files.length} processando
                </span>
              </motion.div>
            )}

            {/* Success state */}
            {allCompressed && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full"
              >
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Todos espremidos!
                </span>
              </motion.div>
            )}

            {/* Compression summary */}
            {allCompressed && !isProcessing && compressionRatio !== 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`font-medium text-sm ${
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
            {allCompressed && !isProcessing && (
              <>
                {' → '}
                <span className={compressionRatio > 0 ? 'text-green-500' : 'text-orange-500'}>
                  {formatBytes(totalCompressedSize)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Progress bar during compression */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3"
          >
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(compressedCount / files.length) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.div>
        )}

        {/* Batch Settings - hidden during processing */}
        {!isProcessing && (
          <>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-3"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurações em lote
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {settingsPanel}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!allCompressed && !isProcessing && (
            <button
              onClick={() => onCompressAll(buildOptions())}
              disabled={files.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Zap className="w-4 h-4" />
              Espremer Todos
            </button>
          )}

          {isProcessing && (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg font-medium cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando {compressedCount}/{files.length}...
            </button>
          )}

          {allCompressed && !isProcessing && (
            <>
              <button
                onClick={() => onRecompressAll(buildOptions())}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                title="Reconfigurar e comprimir novamente"
              >
                <RotateCcw className="w-4 h-4" />
                Re-espremer
              </button>
              <button
                onClick={onDownloadAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar Todos (ZIP)
              </button>
            </>
          )}

          <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            title="Limpar tudo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
