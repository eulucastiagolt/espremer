'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Film } from 'lucide-react';
import { isImageFile, generateId } from '@/lib/utils';
import { ImageFile } from '@/lib/types';

interface DropZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

export default function DropZone({ onFilesAdded }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const files: ImageFile[] = [];
    
    for (const file of Array.from(fileList)) {
      if (!isImageFile(file)) continue;
      
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      let width = 0;
      let height = 0;
      let preview = '';
      
      try {
        const img = new window.Image();
        preview = URL.createObjectURL(file);
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = reject;
          img.src = preview;
        });
      } catch {
        preview = '';
      }
      
      files.push({
        id: generateId(),
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        width,
        height,
        preview,
        isGif,
      });
    }
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const { files } = e.dataTransfer;
    processFiles(files);
  }, [processFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

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
        <label htmlFor="file-upload" className="sr-only">Selecionar imagens</label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
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
                Solte seus arquivos aqui
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
                <Upload className="w-10 h-10 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-zinc-900 dark:text-white">
                  Arraste e solte suas imagens aqui
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  ou clique para selecionar arquivos
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                <div className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  <span>JPG, PNG, WebP, AVIF</span>
                </div>
                <div className="flex items-center gap-1">
                  <Film className="w-4 h-4" />
                  <span>GIF</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
