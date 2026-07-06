import type gifsicle from 'gifsicle-wasm-browser';
import { CompressionOptions } from './types';

let gifsicleModule: typeof gifsicle | null = null;

async function getGifsicle() {
  if (gifsicleModule) return gifsicleModule;
  gifsicleModule = (await import('gifsicle-wasm-browser')).default;
  return gifsicleModule;
}

async function encodeGifWithOptions(
  file: File,
  options: CompressionOptions,
  lossyOverride?: number,
): Promise<Blob> {
  const gifsicle = await getGifsicle();

  const args: string[] = [];

  const optLevel = options.optimizationLevel ?? 3;
  args.push(`-O${optLevel}`);

  const lossy = lossyOverride ?? options.lossy ?? 80;
  if (lossy > 0) {
    const lossyValue = Math.max(1, Math.round(200 - (lossy / 100) * 199));
    args.push(`--lossy=${lossyValue}`);
  }

  if (options.resize) {
    if (options.resize.width && options.resize.height && !options.resize.maintainAspectRatio) {
      args.push(`--resize-method=sample`);
      args.push(`--resize=${options.resize.width}x${options.resize.height}`);
    } else if (options.resize.width) {
      args.push(`--resize-method=sample`);
      args.push(`--resize=${options.resize.width}x_`);
    } else if (options.resize.height) {
      args.push(`--resize-method=sample`);
      args.push(`--resize=_x${options.resize.height}`);
    }
  }

  if (options.quality < 100) {
    const colors = Math.max(2, Math.round((options.quality / 100) * 256));
    args.push(`--colors=${colors}`);
  }

  args.push('--no-interlace');
  args.push('--no-comments');

  const commandStr = [...args, 'input.gif', '-o /out/output.gif'].join(' ');

  const result = await gifsicle.run({
    input: [{ file: file, name: 'input.gif' }],
    command: [commandStr],
  });

  const outputFile = result?.[0];

  if (!outputFile) {
    throw new Error('Gifsicle failed to produce output');
  }

  return new Blob([await outputFile.arrayBuffer()], { type: 'image/gif' });
}

async function compressGifToTargetSize(
  file: File,
  options: CompressionOptions,
): Promise<Blob> {
  const targetBytes = options.targetSizeBytes!;

  // Binary search on lossy value to find the best quality within target size
  let lo = 1;
  let hi = 100;
  let bestBlob: Blob | null = null;
  let bestLossy = 80;

  // Start at lossy 50
  let blob = await encodeGifWithOptions(file, options, 50);

  if (blob.size <= targetBytes) {
    lo = 51;
    bestBlob = blob;
    bestLossy = 50;
  } else {
    hi = 49;
  }

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    blob = await encodeGifWithOptions(file, options, mid);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestLossy = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (!bestBlob) {
    bestBlob = await encodeGifWithOptions(file, options, 1);
    bestLossy = 1;
  }

  return bestBlob;
}

export async function compressGif(
  file: File,
  options: CompressionOptions
): Promise<Blob> {
  if (options.targetSizeBytes && options.targetSizeBytes > 0) {
    return compressGifToTargetSize(file, options);
  }

  return encodeGifWithOptions(file, options);
}

export async function getGifFrameCount(file: File): Promise<number> {
  try {
    const { parseGIF } = await import('gifuct-js');
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    return gif.frames.length;
  } catch {
    return 1;
  }
}
