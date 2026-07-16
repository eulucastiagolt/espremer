/// <reference lib="webworker" />
/**
 * Web Worker que roda o SVGO fora da main thread.
 *
 * Importa SEMPRE de `svgo/browser` — o entry `.` é Node-only (puxa os/fs/path)
 * e quebraria o bundler do Next/Turbopack.
 */
import { optimize } from 'svgo/browser';
import { buildSvgoPlugins } from './svg-plugins';
import type {
  SvgWorkerRequest,
  SvgWorkerResponse,
  SvgOptimizeResult,
} from './svg-types';

/** Tamanho em bytes de uma string (UTF-8). */
function byteLength(s: string): number {
  return new Blob([s]).size;
}

/** Tamanho gzip de uma string via CompressionStream (Chrome/Edge/Firefox/Safari 16.4+). */
async function gzipBytes(s: string): Promise<number | undefined> {
  try {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    const reader = cs.readable.getReader();
    const closed = writer.write(new TextEncoder().encode(s)).then(() => writer.close());

    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
    }
    await closed;
    return total;
  } catch {
    return undefined;
  }
}

async function handle(request: SvgWorkerRequest): Promise<SvgWorkerResponse> {
  const { id, svg, config } = request;
  const originalSize = byteLength(svg);

  const plugins = buildSvgoPlugins(config.preset, config.plugins);

  let data = svg;
  let error: string | undefined;

  try {
    const result = optimize(svg, {
      multipass: config.multipass,
      floatPrecision: config.floatPrecision,
      ...(config.transformPrecision !== undefined
        ? { transformPrecision: config.transformPrecision }
        : {}),
      js2svg: {
        pretty: config.pretty,
        indent: 2,
      },
      // SVGO aceita strings OU { name, params }; o cast acomoda o tipo
      // discriminado PluginConfig do SVGO (que não inclui `params?` para
      // plugins com parâmetros obrigatórios — não usamos nenhum desses).
      plugins: plugins as Parameters<typeof optimize>[1] extends {
        plugins?: infer P;
      }
        ? P
        : never,
    });
    data = result.data;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const optimizedSize = byteLength(data);

  const result: SvgOptimizeResult = {
    data,
    optimizedSize,
    originalSize,
    error,
  };

  if (config.compareGzip) {
    const [og, ogz] = await Promise.all([
      gzipBytes(svg),
      gzipBytes(data),
    ]);
    result.originalGzipSize = og;
    result.optimizedGzipSize = ogz;
  }

  return { id, result };
}

self.onmessage = async (e: MessageEvent<SvgWorkerRequest>) => {
  const response = await handle(e.data);
  (self as unknown as Worker).postMessage(response);
};
