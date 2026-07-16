/**
 * Tipos para a ferramenta de SVG.
 * Independente de SVGO em runtime (o worker faz a ponte), mas espelha
 * a forma de config que o SVGO espera.
 */

export type SvgPreset = 'off' | 'default' | 'strong';

export interface SvgPluginToggle {
  name: string;
  enabled: boolean;
}

export interface SvgOptimizationConfig {
  /** Re-roda o SVGO até o resultado estabilizar (svgomg "Multipass"). */
  multipass: boolean;
  /** Precisão decimal para coordenadas/números (svgomg "Number precision"). */
  floatPrecision: number;
  /** Precisão para valores de transform (svgomg "Transform precision"). */
  transformPrecision?: number;
  /** Reindenta o SVG de saída (js2svg.pretty). */
  pretty: boolean;
  /** Comparar tamanhos comprimidos com gzip além dos bytes brutos. */
  compareGzip: boolean;
  /** Pres ativo — controla em massa os plugins. */
  preset: SvgPreset;
  /** Toggles individuais de plugins (sobrepostos ao preset). */
  plugins: SvgPluginToggle[];
}

export interface SvgInputState {
  /** Nome original do arquivo (ou "demo.svg" / "colado.svg"). */
  name: string;
  /** Markup do SVG original (entrada do usuário, antes de qualquer edição). */
  text: string;
  /** Tamanho em bytes do original. */
  size: number;
}

export interface SvgOptimizeResult {
  /** Markup otimizado. */
  data: string;
  /** Tamanho em bytes do otimizado. */
  optimizedSize: number;
  /** Tamanho em bytes do original re-enviado pelo worker. */
  originalSize: number;
  /** Tamanho gzip do original (bytes), se solicitado. */
  originalGzipSize?: number;
  /** Tamanho gzip do otimizado (bytes), se solicitado. */
  optimizedGzipSize?: number;
  /** Mensagem de erro, se houver. */
  error?: string;
}

/** Mensagem ida: host → worker. */
export interface SvgWorkerRequest {
  id: number;
  svg: string;
  config: SvgOptimizationConfig;
}

/** Mensagem volta: worker → host. */
export interface SvgWorkerResponse {
  id: number;
  result: SvgOptimizeResult;
}

export const SVG_DEFAULT_CONFIG: SvgOptimizationConfig = {
  multipass: true,
  floatPrecision: 3,
  pretty: true,
  compareGzip: false,
  preset: 'default',
  plugins: [],
};
