'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  Download, 
  Settings, 
  Loader2,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { ImageFile, CompressionOptions, DEFAULT_COMPRESSION_OPTIONS, GIF_DEFAULT_OPTIONS, ImageFormat } from '@/lib/types';
import ImageComparisonSlider from './ImageComparisonSlider';
import { formatBytes } from '@/lib/utils';

interface FileCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onCompress: (id: string, options: CompressionOptions) => void;
  compressedResult?: {
    blob: Blob;
    url: string;
    format: ImageFormat;
  };
  isProcessing?: boolean;
  error?: string;
}

export default function FileCard({ 
  image, 
  onRemove, 
  onCompress,
  compressedResult,
  isProcessing,
  error 
}: FileCardProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [options, setOptions] = useState<CompressionOptions>(
    image.isGif ? { ...GIF_DEFAULT_OPTIONS } : { ...DEFAULT_COMPRESSION_OPTIONS }
  );
  const compressionRatio = compressedResult 
    ? Math.round((1 - compressedResult.blob.size / image.size) * 100) 
    : 0;

  // Track whether options changed since last compression
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  const [lastCompressedKey, setLastCompressedKey] = useState<string | null>(null);
  const hasNewChanges = compressedResult && lastCompressedKey !== optionsKey;

  const handleCompress = useCallback(() => {
    onCompress(image.id, options);
    setLastCompressedKey(JSON.stringify(options));
  }, [image.id, options, onCompress]);


  const handleDownload = useCallback(() => {
    if (!compressedResult) return;
    
    const link = document.createElement('a');
    link.href = compressedResult.url;
    const ext = compressedResult.format;
    const baseName = image.name.replace(/\.[^.]+$/, '');
    link.download = `${baseName}_espremido.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [compressedResult, image.name]);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div 
            className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 cursor-pointer"
            onClick={() => setShowPreview(true)}
          >
            {image.preview ? (
              <img 
                src={image.preview} 
                alt={image.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-900 dark:text-white truncate">
              {image.name}
            </p>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span>{formatBytes(image.size)}</span>
              {image.width && image.height && (
                <>
                  <span>•</span>
                  <span>{image.width}×{image.height}</span>
                </>
              )}
              {image.isGif && (
                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded font-medium">
                  GIF
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Configurações"
            >
              <Settings className="w-4 h-4 text-zinc-500" />
            </button>
            <button
              onClick={() => onRemove(image.id)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800/50"
          >
            <div className="space-y-4">
              {/* Target Size or Quality - mutually exclusive */}
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, targetSizeBytes: undefined }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !options.targetSizeBytes
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      Qualidade
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, targetSizeBytes: prev.targetSizeBytes ?? image.size }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !!options.targetSizeBytes
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      Tamanho Alvo
                    </button>
                  </div>

                {options.targetSizeBytes ? (
                  <div>
                    <label htmlFor={`target-size-${image.id}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Tamanho desejado (MB)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`target-size-${image.id}`}
                        type="number"
                        min="0.01"
                        step="0.1"
                        value={options.targetSizeBytes ? (options.targetSizeBytes / (1024 * 1024)).toFixed(2) : ''}
                        onChange={(e) => {
                          const mb = parseFloat(e.target.value);
                          setOptions(prev => ({
                            ...prev,
                            targetSizeBytes: isNaN(mb) || mb <= 0 ? undefined : Math.round(mb * 1024 * 1024),
                          }));
                        }}
                        placeholder="Ex: 3.0"
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                      />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">MB</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Tamanho original: {formatBytes(image.size)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`quality-${image.id}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Qualidade: {options.quality}%
                    </label>                      <input
                        id={`quality-${image.id}`}
                        type="range"
                        min="1"
                        max="100"
                        value={options.quality}
                      onChange={(e) => setOptions(prev => ({ ...prev, quality: Number(e.target.value) }))}
                      className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Format */}
              <div>
                <label htmlFor={`format-${image.id}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Formato de Saída
                </label>
                <select
                  id={`format-${image.id}`}
                  value={options.format}
                  onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as CompressionOptions['format'] }))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                >
                  <option value="auto">Automático</option>
                  {!image.isGif && <option value="jpeg">JPEG</option>}
                  {!image.isGif && <option value="png">PNG</option>}
                  {!image.isGif && <option value="webp">WebP</option>}
                  {!image.isGif && <option value="avif">AVIF</option>}
                  {image.isGif && <option value="gif">GIF</option>}
                </select>
              </div>

              {/* Resize */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id={`resize-${image.id}`}
                    checked={!!options.resize}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      resize: e.target.checked 
                        ? { width: image.width || 800, height: image.height || 600, maintainAspectRatio: true }
                        : undefined
                    }))}
                    className="rounded border-zinc-300"
                  />
                  <label htmlFor={`resize-${image.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Redimensionar
                  </label>
                </div>
                {options.resize && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 dark:text-zinc-400">Largura</label>
                        <input
                          type="number"
                          value={options.resize.width || ''}
                          onChange={(e) => {
                            const w = Number(e.target.value) || 0;
                            setOptions(prev => {
                              if (!prev.resize) return prev;
                              const ratio = (image.width && image.height) ? image.height / image.width : 0;
                              const h = prev.resize.maintainAspectRatio && w > 0 && ratio > 0
                                ? Math.round(w * ratio)
                                : prev.resize.height;
                              return { ...prev, resize: { ...prev.resize, width: w || undefined, height: h } };
                            });
                          }}
                          placeholder="px"
                          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                        />
                      </div>
                      <span className="text-zinc-400 mt-4">×</span>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 dark:text-zinc-400">Altura</label>
                        <input
                          type="number"
                          value={options.resize.height || ''}
                          onChange={(e) => {
                            const h = Number(e.target.value) || 0;
                            setOptions(prev => {
                              if (!prev.resize) return prev;
                              const ratio = (image.width && image.height) ? image.width / image.height : 0;
                              const w = prev.resize.maintainAspectRatio && h > 0 && ratio > 0
                                ? Math.round(h * ratio)
                                : prev.resize.width;
                              return { ...prev, resize: { ...prev.resize, width: w, height: h || undefined } };
                            });
                          }}
                          placeholder="px"
                          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-sm text-zinc-500">
                      <input
                        type="checkbox"
                        checked={options.resize?.maintainAspectRatio ?? true}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          resize: prev.resize ? { ...prev.resize, maintainAspectRatio: e.target.checked } : undefined
                        }))}
                        className="rounded border-zinc-300"
                      />
                      Manter proporcionalidade
                    </label>
                    {image.width && image.height && (
                      <p className="text-xs text-zinc-400">
                        Original: {image.width} × {image.height}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* GIF-specific options */}
              {image.isGif && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Lossy: {options.lossy ?? 80}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={options.lossy ?? 80}
                      onChange={(e) => setOptions(prev => ({ ...prev, lossy: Number(e.target.value) }))}
                      className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Otimização
                    </label>
                    <select
                      value={options.optimizationLevel ?? 3}
                      onChange={(e) => setOptions(prev => ({ ...prev, optimizationLevel: Number(e.target.value) as 1 | 2 | 3 }))}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                    >
                      <option value={1}>Nível 1 (Rápido)</option>
                      <option value={2}>Nível 2 (Equilibrado)</option>
                      <option value={3}>Nível 3 (Máxima compressão)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Results */}
        <div className="p-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {compressedResult && !error && !hasNewChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {compressionRatio > 0 
                      ? `${compressionRatio}% menor` 
                      : `${Math.abs(compressionRatio)}% maior`}
                  </span>
                </div>
                <span className="text-sm text-zinc-500">
                  {formatBytes(compressedResult.blob.size)}
                </span>
              </div>
              
              {/* Compression bar */}
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ 
                    width: `${Math.max(5, Math.min(100, (compressedResult.blob.size / image.size) * 100))}%` 
                  }}
                  className={`h-full rounded-full ${
                    compressionRatio > 0 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Before/After Comparison */}
              {image.preview && (
                <ImageComparisonSlider
                  originalSrc={image.preview}
                  compressedSrc={compressedResult.url}
                  originalName={image.name}
                  originalSize={image.size}
                  compressedSize={compressedResult.blob.size}
                  originalDimensions={image.width && image.height ? { width: image.width, height: image.height } : undefined}
                />
              )}

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar {compressedResult.format.toUpperCase()}
              </button>
            </motion.div>
          )}

          {(!compressedResult || hasNewChanges) && !error && !isProcessing && (
            <button
              onClick={handleCompress}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Espremer
            </button>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-2.5 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      {showPreview && image.preview && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl max-h-[90vh] relative"
          >
            <img
              src={image.preview}
              alt={image.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
              {image.name} • {formatBytes(image.size)}
              {image.width && image.height && ` • ${image.width}×${image.height}`}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
