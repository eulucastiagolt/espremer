import { CompressionOptions, ImageFormat } from './types';
import { getMimeType, getOutputFormat, isGifFile } from './utils';

// Dynamic imports for WASM codecs (only loaded in browser)
async function getCodec(format: ImageFormat) {
  switch (format) {
    case 'jpeg': {
      const mod = await import('@jsquash/jpeg');
      return { encode: mod.encode };
    }
    case 'png': {
      const mod = await import('@jsquash/png');
      return { encode: mod.encode };
    }
    case 'webp': {
      const mod = await import('@jsquash/webp');
      return { encode: mod.encode };
    }
    case 'avif': {
      const mod = await import('@jsquash/avif');
      return { encode: mod.encode };
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

type Codec = { encode: (data: ImageData, options?: Record<string, unknown>) => Promise<ArrayBuffer> };

async function fileToImageData(
  file: File,
  resize?: CompressionOptions['resize']
): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  if (resize) {
    if (resize.width && resize.height && !resize.maintainAspectRatio) {
      width = resize.width;
      height = resize.height;
    } else if (resize.width) {
      width = resize.width;
      if (resize.maintainAspectRatio) {
        height = Math.round((bitmap.height / bitmap.width) * width);
      }
    } else if (resize.height) {
      height = resize.height;
      if (resize.maintainAspectRatio) {
        width = Math.round((bitmap.width / bitmap.height) * height);
      }
    }
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return ctx.getImageData(0, 0, width, height);
}

function buildEncodeOptions(format: ImageFormat, quality: number): Record<string, unknown> {
  const opts: Record<string, unknown> = {};
  if (format === 'jpeg' || format === 'webp' || format === 'png') {
    opts.quality = quality;
  } else if (format === 'avif') {
    opts.quality = quality;
    opts.minQuantizer = Math.round(63 - (quality / 100) * 63);
    opts.maxQuantizer = Math.round(63 - (quality / 100) * 63);
  }
  return opts;
}

async function encodeWithQuality(
  imageData: ImageData,
  codec: Codec,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  const encodeOptions = buildEncodeOptions(format, quality);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encodedBuffer = await (codec.encode as any)(imageData, encodeOptions);
  const mimeType = getMimeType(format);
  return new Blob([encodedBuffer as ArrayBuffer], { type: mimeType });
}

async function compressToTargetSize(
  imageData: ImageData,
  format: ImageFormat,
  targetBytes: number
): Promise<Blob> {
  const codec = await getCodec(format);

  let lo = 1;
  let hi = 100;
  let bestBlob: Blob | null = null;
  let bestQuality = 50;

  // Start at quality 50 and search from there
  let blob = await encodeWithQuality(imageData, codec, format, 50);

  if (blob.size <= targetBytes) {
    // Under target at quality 50 — search higher for better visuals
    lo = 51;
    bestBlob = blob;
    bestQuality = 50;
  } else {
    // Over target at quality 50 — search lower
    hi = 49;
  }

  // Binary search for the best quality within the target
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    blob = await encodeWithQuality(imageData, codec, format, mid);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // Fallback to lowest quality if nothing fit
  if (!bestBlob) {
    bestBlob = await encodeWithQuality(imageData, codec, format, 1);
    bestQuality = 1;
  }

  return bestBlob;
}

export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<{ blob: Blob; format: ImageFormat }> {
  if (isGifFile(file)) {
    const { compressGif } = await import('./gif-processor');
    const blob = await compressGif(file, options);
    return { blob, format: 'gif' };
  }

  const outputFormat = getOutputFormat(file, options.format);
  const imageData = await fileToImageData(file, options.resize);

  let blob: Blob;

  if (options.targetSizeBytes && options.targetSizeBytes > 0) {
    blob = await compressToTargetSize(imageData, outputFormat, options.targetSizeBytes);
  } else {
    const codec = await getCodec(outputFormat);
    blob = await encodeWithQuality(imageData, codec, outputFormat, options.quality);
  }

  return { blob, format: outputFormat };
}
