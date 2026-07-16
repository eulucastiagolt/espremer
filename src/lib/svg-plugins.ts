/**
 * Catálogo dos plugins do SVGO para a UI de toggles.
 *
 * A lista vem de `svgo/browser` (`builtinPlugins`), mas é fixada aqui como
 * metadados (nome + grupo + descrição + se é parte do preset-default) para
 * podermos renderizar a UI sem carregar o SVGO na main thread.
 *
 * O `preset-default` ativa 33 plugins (lista em
 * node_modules/svgo/plugins/preset-default.js). Os demais são opt-in.
 */

import type { SvgPreset, SvgPluginToggle } from './svg-types';

export type SvgPluginGroup =
  | 'Remover'
  | 'Limpar'
  | 'Converter'
  | 'Estilos'
  | 'Agrupar'
  | 'Paths'
  | 'Ordenar'
  | 'Adicionar';

export interface SvgPluginInfo {
  name: string;
  group: SvgPluginGroup;
  description: string;
  /** Faz parte do preset-default (ativo por padrão). */
  inDefault: boolean;
}

/**
 * Lista canônica dos plugins que o preset-default ativa.
 * (espelha node_modules/svgo/plugins/preset-default.js)
 */
export const PRESET_DEFAULT_PLUGINS = new Set<string>([
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeDeprecatedAttrs',
  'removeMetadata',
  'removeEditorsNSData',
  'cleanupAttrs',
  'mergeStyles',
  'inlineStyles',
  'minifyStyles',
  'cleanupIds',
  'removeUselessDefs',
  'cleanupNumericValues',
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'cleanupEnableBackground',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  'convertEllipseToCircle',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'removeUnusedNS',
  'sortAttrs',
  'sortDefsChildren',
  'removeDesc',
]);

/**
 * Catálogo completo (53 plugins úteis, excluindo o meta-plugin
 * `preset-default` e utilitários internos). Derivado de
 * `builtinPlugins` do `svgo/browser`.
 */
export const SVG_PLUGINS: SvgPluginInfo[] = [
  // — Remover —
  { name: 'removeDoctype', group: 'Remover', description: 'Remove a declaração DOCTYPE.', inDefault: true },
  { name: 'removeXMLProcInst', group: 'Remover', description: 'Remove instruções de processamento XML (ex. <?xml ?>).', inDefault: true },
  { name: 'removeComments', group: 'Remover', description: 'Remove comentários (<!-- -->).', inDefault: true },
  { name: 'removeDeprecatedAttrs', group: 'Remover', description: 'Remove atributos SVG depreciados.', inDefault: true },
  { name: 'removeMetadata', group: 'Remover', description: 'Remove <metadata>.', inDefault: true },
  { name: 'removeEditorsNSData', group: 'Remover', description: 'Remove namespaces de editores (Illustrator, Sketch…).', inDefault: true },
  { name: 'removeDesc', group: 'Remover', description: 'Remove <desc> (descrição acessível).', inDefault: true },
  { name: 'removeTitle', group: 'Remover', description: 'Remove <title>.', inDefault: false },
  { name: 'removeViewBox', group: 'Remover', description: 'Remove o atributo viewBox.', inDefault: false },
  { name: 'removeDimensions', group: 'Remover', description: 'Remove width/height (mantém viewBox).', inDefault: false },
  { name: 'removeRasterImages', group: 'Remover', description: 'Remove imagens raster (<image>).', inDefault: false },
  { name: 'removeScripts', group: 'Remover', description: 'Remove <script> para SVGs seguros.', inDefault: false },
  { name: 'removeStyleElement', group: 'Remover', description: 'Remove elementos <style>.', inDefault: false },
  { name: 'removeXlink', group: 'Remover', description: 'Converte xlink:href para href.', inDefault: false },
  { name: 'removeXMLNS', group: 'Remover', description: 'Remove o xmlns (para SVG inline em HTML).', inDefault: false },
  { name: 'removeOffCanvasPaths', group: 'Remover', description: 'Remove paths fora do viewBox.', inDefault: false },
  { name: 'removeHiddenElems', group: 'Remover', description: 'Remove elementos invisíveis (display:none, etc).', inDefault: true },
  { name: 'removeEmptyContainers', group: 'Remover', description: 'Remove containers vazios (<g>, <svg>…).', inDefault: true },
  { name: 'removeEmptyText', group: 'Remover', description: 'Remove <text> e <tspan> vazios.', inDefault: true },
  { name: 'removeEmptyAttrs', group: 'Remover', description: 'Remove atributos vazios.', inDefault: true },
  { name: 'removeUselessDefs', group: 'Remover', description: 'Remove <defs> sem referência.', inDefault: true },
  { name: 'removeUnusedNS', group: 'Remover', description: 'Remove namespaces não usados.', inDefault: true },
  { name: 'removeUselessStrokeAndFill', group: 'Remover', description: 'Remove stroke/fill redundantes.', inDefault: true },
  { name: 'removeNonInheritableGroupAttrs', group: 'Remover', description: 'Remove atributos de grupo não-herdáveis.', inDefault: true },
  { name: 'removeAttributesBySelector', group: 'Remover', description: 'Remove atributos por seletor CSS (config).', inDefault: false },
  { name: 'removeAttrs', group: 'Remover', description: 'Remove atributos por nome/expressão (config).', inDefault: false },
  { name: 'removeElementsByAttr', group: 'Remover', description: 'Remove elementos por id/classe (config).', inDefault: false },

  // — Limpar —
  { name: 'cleanupAttrs', group: 'Limpar', description: 'Normaliza espaços em atributos.', inDefault: true },
  { name: 'cleanupIds', group: 'Limpar', description: 'Minifica e remove ids não referenciados.', inDefault: true },
  { name: 'cleanupNumericValues', group: 'Limpar', description: 'Arredonda números para a precisão configurada.', inDefault: true },
  { name: 'cleanupListOfValues', group: 'Limpar', description: 'Arredonda listas de números (ex. viewBox).', inDefault: false },
  { name: 'cleanupEnableBackground', group: 'Limpar', description: 'Normaliza enable-background.', inDefault: true },

  // — Converter —
  { name: 'convertColors', group: 'Converter', description: 'Converte cores para a forma mais curta (hex/nome).', inDefault: true },
  { name: 'convertEllipseToCircle', group: 'Converter', description: 'Converte <ellipse> sem raios diferentes em <circle>.', inDefault: true },
  { name: 'convertShapeToPath', group: 'Converter', description: 'Converte formas básicas em <path>.', inDefault: true },
  { name: 'convertPathData', group: 'Converter', description: 'Minifica dados de path (comandos, números).', inDefault: true },
  { name: 'convertTransform', group: 'Converter', description: 'Minifica transform.', inDefault: true },
  { name: 'convertStyleToAttrs', group: 'Converter', description: 'Converte style inline em atributos de apresentação.', inDefault: false },
  { name: 'convertOneStopGradients', group: 'Converter', description: 'Converte gradientes de 1 parada em sólido.', inDefault: false },

  // — Estilos —
  { name: 'mergeStyles', group: 'Estilos', description: 'Mescla múltiplos <style>.', inDefault: true },
  { name: 'inlineStyles', group: 'Estilos', description: 'Move styles de <style> para atributos.', inDefault: true },
  { name: 'minifyStyles', group: 'Estilos', description: 'Minifica CSS dentro de <style> com csso.', inDefault: true },
  { name: 'prefixIds', group: 'Estilos', description: 'Prefixa ids/classes para evitar colisão (config).', inDefault: false },

  // — Agrupar —
  { name: 'moveElemsAttrsToGroup', group: 'Agrupar', description: 'Move atributos comuns para um <g> pai.', inDefault: true },
  { name: 'moveGroupAttrsToElems', group: 'Agrupar', description: 'Move atributos de <g> para os filhos.', inDefault: true },
  { name: 'collapseGroups', group: 'Agrupar', description: 'Remove <g> sem efeito visual.', inDefault: true },

  // — Paths —
  { name: 'mergePaths', group: 'Paths', description: 'Mescla múltiplos <path> em um.', inDefault: true },
  { name: 'reusePaths', group: 'Paths', description: 'Reutiliza paths repetidos via <use>.', inDefault: false },

  // — Ordenar —
  { name: 'sortAttrs', group: 'Ordenar', description: 'Ordena atributos por nome.', inDefault: true },
  { name: 'sortDefsChildren', group: 'Ordenar', description: 'Ordena filhos de <defs>.', inDefault: true },

  // — Adicionar —
  { name: 'addAttributesToSVGElement', group: 'Adicionar', description: 'Adiciona atributos ao <svg> root (config).', inDefault: false },
  { name: 'addClassesToSVGElement', group: 'Adicionar', description: 'Adiciona classes ao <svg> root (config).', inDefault: false },
];

/** Plugins agrupados por grupo, para renderizar a UI em seções. */
export const SVG_PLUGINS_BY_GROUP = SVG_PLUGINS.reduce<Record<string, SvgPluginInfo[]>>(
  (acc, plugin) => {
    (acc[plugin.group] ??= []).push(plugin);
    return acc;
  },
  {},
);

export const SVG_PLUGIN_NAMES = SVG_PLUGINS.map((p) => p.name);

/** Plugins extra ativados no preset "strong" (além do default). */
export const PRESET_STRONG_EXTRA = [
  'removeDimensions',
  'removeTitle',
  'removeScripts',
  'removeStyleElement',
  'removeRasterImages',
  'convertStyleToAttrs',
  'reusePaths',
  'removeOffCanvasPaths',
];

/**
 * Constrói a lista de plugins para o `optimize()` do SVGO a partir do
 * estado da UI (preset + toggles individuais).
 *
 * Estratégia:
 *  - preset 'off'     → desativa tudo; apenas reativa os toggles marcados.
 *  - preset 'default' → usa `preset-default` com overrides para desativar
 *                       quem foi desmarcado; ativa extras marcados.
 *  - preset 'strong'  → idem + extras do strong ativados por padrão.
 *
 * Retorna o array de plugins no formato aceito pelo SVGO.
 */
export function buildSvgoPlugins(
  preset: SvgPreset,
  toggles: SvgPluginToggle[],
): Array<string | { name: string; params?: Record<string, unknown> }> {
  // Determina quais plugins estão "base ativos" conforme o preset.
  const baseActive = new Set<string>();
  if (preset === 'default' || preset === 'strong') {
    for (const name of PRESET_DEFAULT_PLUGINS) baseActive.add(name);
  }
  if (preset === 'strong') {
    for (const name of PRESET_STRONG_EXTRA) baseActive.add(name);
  }

  // Aplica overrides explícitos do usuário.
  for (const { name, enabled } of toggles) {
    if (enabled) baseActive.add(name);
    else baseActive.delete(name);
  }

  // Sem nada ativo → array vazio (SVGO não faz nada).
  if (baseActive.size === 0) return [];

  // Constrói o array. Quando o preset é default/strong, usamos o
  // meta-plugin `preset-default` com overrides para desligar o que o
  // usuário desmarcou — isso garante a ordem/dependências corretas do
  // SVGO. Plugins extras (não-default) vão como strings separadas.
  const plugins: Array<string | { name: string; params?: Record<string, unknown> }> = [];

  if (preset === 'default' || preset === 'strong') {
    const overrides: Record<string, boolean> = {};
    for (const name of PRESET_DEFAULT_PLUGINS) {
      if (!baseActive.has(name)) {
        overrides[name] = false;
      }
    }
    plugins.push({ name: 'preset-default', params: { overrides } });

    // Extras do strong que estão ativos (e qualquer toggle não-default).
    for (const name of baseActive) {
      if (!PRESET_DEFAULT_PLUGINS.has(name)) {
        plugins.push(name);
      }
    }
  } else {
    // preset 'off' — apenas lista os ativados explicitamente.
    for (const name of baseActive) {
      plugins.push(name);
    }
  }

  return plugins;
}
