import { ImageFormat } from './types';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function isGifFile(file: File): boolean {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || 
    /\.(jpe?g|png|webp|avif|gif|bmp|tiff?)$/i.test(file.name);
}

export function getOutputFormat(file: File, targetFormat: ImageFormat | 'auto'): ImageFormat {
  if (targetFormat !== 'auto') return targetFormat;
  if (isGifFile(file)) return 'gif';
  
  const mimeType = file.type;
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/avif') return 'avif';
  return 'jpeg';
}

export function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
  };
  return mimeTypes[format];
}

export function getFileExtension(format: ImageFormat): string {
  return format;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function calculateReduction(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round((1 - compressed / original) * 100);
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function isSvgFile(file: File): boolean {
  return (
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg')
  );
}

/** Converte um markup SVG em um data: URI pronto para usar em <img src> ou CSS. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
