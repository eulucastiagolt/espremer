export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface CompressionOptions {
  quality: number; // 0-100
  format: ImageFormat | 'auto';
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
  };
  /** Target file size in bytes. When set, quality is ignored and binary search finds the best quality to hit this size. */
  targetSizeBytes?: number;
  lossy?: number; // For GIF lossy compression (0-100)
  optimizationLevel?: number; // For GIF optimization (1-3)
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  preview?: string;
  isGif: boolean;
  frames?: number;
  duration?: number;
}

export interface ProcessedImage {
  id: string;
  original: ImageFile;
  compressed: Blob;
  compressedSize: number;
  compressedUrl: string;
  compressionRatio: number;
  processingTime: number;
  format: ImageFormat;
  settings: CompressionOptions;
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  quality: 75,
  format: 'auto',
  resize: undefined,
};

export const GIF_DEFAULT_OPTIONS: CompressionOptions = {
  quality: 75,
  format: 'gif',
  lossy: 80,
  optimizationLevel: 3,
};
