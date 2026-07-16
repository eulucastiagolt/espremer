/**
 * Camada de acesso à API local de ícones.
 *
 * Estratégia:
 * - Todos os ícones são servidos localmente via /api/icons.
 * - Cache em memória (sessão) + localStorage (24h) para navegação repetida.
 * - Sem dependência de APIs externas.
 */

const API = '/api/icons';

/** Licenças consideradas permissivas para o nosso catálogo. */
export type IconLicense =
  | 'MIT'
  | 'ISC'
  | 'Apache 2.0'
  | 'CC0 1.0'
  | 'CC BY 4.0'
  | 'Open Font License'
  | 'Unknown';

export interface IconSetInfo {
  prefix: string;
  name: string;
  /** Total de ícones no conjunto. */
  total: number;
  license: IconLicense;
  /** Altura padrão (px). */
  height?: number;
  /** Categoria humana (Material, UI 24px, etc.). */
  category?: string;
}

/**
 * Conjuntos curados — todos com licenças permissivas.
 */
export const CURATED_SETS: IconSetInfo[] = [
  { prefix: 'lucide', name: 'Lucide', total: 1747, license: 'ISC', height: 24, category: 'UI 24px' },
  { prefix: 'tabler', name: 'Tabler Icons', total: 6146, license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'heroicons', name: 'Heroicons', total: 1288, license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'ri', name: 'Remix Icon', total: 3188, license: 'Apache 2.0', height: 24, category: 'UI 24px' },
  { prefix: 'bx', name: 'Boxicons', total: 3768, license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'bi', name: 'Bootstrap Icons', total: 2078, license: 'MIT', height: 16, category: 'UI' },
  { prefix: 'iconoir', name: 'Iconoir', total: 1808, license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'mynaui', name: 'Myna UI', total: 2616, license: 'MIT', height: 24, category: 'UI 24px' },
  { prefix: 'community', name: 'Community', total: 0, license: 'CC BY 4.0', height: 24, category: 'Comunidade' },
];

export async function fetchAvailableSets(): Promise<IconSetInfo[]> {
  const response = await fetch(`${API}/catalog`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Icon API ${response.status}`);
  const data = (await response.json()) as { families: Array<IconSetInfo> };
  return data.families.filter((set) => set.total > 0);
}

/* ── Cache em memória (sobrevive entre renders, não entre reloads) ──── */

interface CacheEntry<T> {
  value: T;
  ts: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

/** TTL: 24h em ms. */
const TTL = 24 * 60 * 60 * 1000;

/** Remove entradas antigas do localStorage (keys sem versão). */
function cleanupStaleLS(): void {
  try {
    const prefix = 'local:';
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.includes(':v2:')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}
// Executa uma vez no carregamento do módulo.
if (typeof window !== 'undefined') cleanupStaleLS();

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - parsed.ts > TTL) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeLS<T>(key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* quota cheia ou modo privado — ignora. */
  }
}

async function fetchJSON<T>(url: string, cacheKey: string): Promise<T> {
  const mem = memCache.get(cacheKey);
  if (mem && Date.now() - mem.ts < TTL) {
    return mem.value as T;
  }
  const ls = readLS<T>(cacheKey);
  if (ls) {
    memCache.set(cacheKey, { value: ls as unknown, ts: Date.now() });
    return ls;
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Icon API ${res.status}: ${url}`);
  const data = (await res.json()) as T;
  memCache.set(cacheKey, { value: data as unknown, ts: Date.now() });
  writeLS(cacheKey, data);
  return data;
}

/* ── Respostas da API local ──────────────────────────────────────── */

interface LocalSearchResponse {
  icons: Array<{
    set: string;
    name: string;
    categories?: string[];
  }>;
  total: number;
}

/* ── Endpoints ─────────────────────────────────────────────────────── */

/**
 * Busca a lista de NOMES de todos os ícones de um conjunto — leve.
 * Suporta categorias quando disponíveis.
 */
export async function fetchSetCollection(
  prefix: string,
): Promise<IconCollection> {
  const response = await fetch(`${API}/catalog?family=${encodeURIComponent(prefix)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Icon catalog ${response.status}: ${prefix}`);
  const data = (await response.json()) as { family: { prefix: string; name: string; license: string; total: number }; icons: Array<{ name: string; categories?: string[] }> };
  if (!data.family || !Array.isArray(data.icons)) {
    throw new Error(`Icon catalog response is invalid: ${prefix}`);
  }

  // Constrói categorias a partir dos dados da API
  const categories: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  for (const icon of data.icons) {
    const iconName = icon.name;
    const iconData = icon;
    if (iconData?.categories && iconData.categories.length > 0) {
      for (const cat of iconData.categories) {
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(iconName);
      }
    } else {
      uncategorized.push(iconName);
    }
  }

  return {
    prefix: data.family.prefix,
    total: data.family.total,
    title: data.family.name,
    categories: Object.keys(categories).length > 0 ? categories : undefined,
    uncategorized: uncategorized.length > 0 ? uncategorized : undefined,
  };
}

/**
 * Busca os SVGs de ícones em lote.
 * Retorna um mapa nome → SVG string.
 */
export async function fetchIconBodies(
  prefix: string,
  names: string[],
): Promise<Record<string, string>> {
  if (names.length === 0) return {};

  // Busca cada ícone individualmente via API
  const results: Record<string, string> = {};

  // Busca em paralelo (limitado a 10 por vez para não sobrecarregar)
  const BATCH = 10;
  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH);
    const promises = batch.map(async (name) => {
      try {
        const svg = await fetchIconSvg(prefix, name);
        results[name] = svg;
      } catch {
        // Ignora ícones que falharam
      }
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Busca o SVG de um único ícone.
 */
export async function fetchIconSvg(prefix: string, name: string): Promise<string> {
  const url = `/icons/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`;
  const key = `local:svg:${prefix}:${name}`;

  // Tenta cache em memória primeiro
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.ts < TTL) {
    return mem.value as string;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Icon API ${res.status}: ${url}`);
  const svg = await res.text();

  memCache.set(key, { value: svg, ts: Date.now() });
  writeLS(key, svg);
  return svg;
}

/**
 * Busca ícones por palavra-chave.
 */
export async function searchIcons(
  query: string,
  prefix: string,
  limit = 64,
): Promise<{ names: string[]; total: number }> {
  const q = query.trim();
  if (!q) return { names: [], total: 0 };

  const url = `${API}?q=${encodeURIComponent(q)}&limit=${limit}`;
  const key = `local:search:${prefix}:${q}:${limit}`;
  const data = await fetchJSON<LocalSearchResponse>(url, key);

  // Filtra por prefix se fornecido
  const filtered = data.icons.filter((icon) => icon.set === prefix);
  return {
    names: filtered.map((icon) => icon.name),
    total: filtered.length,
  };
}

/* ── Tipos auxiliares ─────────────────────────────────────────────── */

export interface IconCollection {
  prefix: string;
  total: number;
  title: string;
  categories?: Record<string, string[]>;
  uncategorized?: string[];
  aliases?: Record<string, string>;
}

/* ── Community icons (ícones públicos compartilhados) ──────────────── */

interface CommunityIcon {
  id: string;
  svg: string;
  name: string;
  createdAt: string;
}

interface CommunityResponse {
  icons: CommunityIcon[];
  total: number;
}

/**
 * Busca ícones públicos da comunidade.
 * Retorna uma IconCollection fake para compatibilidade com o IconLibrary.
 */
export async function fetchCommunityIcons(): Promise<IconCollection> {
  const url = '/api/share';
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Community API ${res.status}`);
  const data = (await res.json()) as CommunityResponse;

  // Mapeia para o formato de collection
  const uncategorized = data.icons.map((icon) => icon.id);

  return {
    prefix: 'community',
    total: data.total,
    title: 'Community',
    uncategorized: uncategorized.length > 0 ? uncategorized : undefined,
  };
}

/**
 * Busca o SVG de um ícone da comunidade por ID.
 */
export async function fetchCommunityIconSvg(id: string): Promise<string> {
  const url = `/api/share?id=${encodeURIComponent(id)}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Community API ${res.status}: ${url}`);
  const data = (await res.json()) as CommunityIcon;

  return data.svg;
}
