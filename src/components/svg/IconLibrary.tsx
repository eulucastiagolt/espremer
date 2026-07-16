'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2, Library, ChevronDown, X } from 'lucide-react';
import {
  CURATED_SETS,
  fetchIconBodies,
  fetchIconSvg,
  fetchSetCollection,
  fetchCommunityIcons,
  fetchCommunityIconSvg,
  fetchAvailableSets,
  type IconCollection,
  type IconSetInfo,
} from '@/lib/iconify';


interface IconLibraryProps {
  /** Chamado quando o usuário escolhe um ícone (SVG completo no editor). */
  onPickIcon: (svg: string, name: string) => void;
}

/** Tamanho de cada batch de SVGs carregado por lazy-scroll. */
const BODY_BATCH = 40;

/** Embaralha um array (Fisher-Yates) e retorna um novo array. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function scopeSvgIds(svg: string, name: string) {
  const prefix = `icon-${name.replace(/[^a-z0-9_-]/gi, '-')}`;
  return svg
    .replace(/\bid=(['"])([^'"]+)\1/g, (_match, quote: string, id: string) => `id=${quote}${prefix}-${id}${quote}`)
    .replace(/url\(#([^\)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/((?:href|xlink:href)=['"])#([^'"]+)(['"])/g, `$1#${prefix}-$2$3`);
}

/** Grupo de ícones (categoria ou "Todos"). */
interface IconGroup {
  name: string;
  icons: string[];
}

export default function IconLibrary({ onPickIcon }: IconLibraryProps) {
  const [selectedSet, setSelectedSet] = useState<IconSetInfo>(CURATED_SETS[0]);
  const [availableSets, setAvailableSets] = useState<IconSetInfo[]>(CURATED_SETS);
  const [query, setQuery] = useState('');

  // Lista de grupos (categorias ou um único "Todos").
  const [groups, setGroups] = useState<IconGroup[]>([]);

  // Bodies (SVGs) carregados sob demanda — name → svg.
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [failedBodies, setFailedBodies] = useState<Record<string, boolean>>({});
  const [loadingBodies, setLoadingBodies] = useState(false);

  // Estado geral.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setMenuOpen, setSetMenuOpen] = useState(false);
  const requestedSetRef = useRef<string | null>(null);

  /* ── Lista filtrada (useMemo — sem effect, sem setState) ────────── */
  // Busca local instantânea: filtra a lista de nomes que já temos.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const all = groups.flatMap((g) => g.icons);
    // Deduplica (alguns sets repetem nomes entre categorias).
    return Array.from(new Set(all.filter((n) => n.toLowerCase().includes(q))));
  }, [query, groups]);

  /** Lista linear de todos os nomes visíveis (filtrados ou não). */
  const visibleNames = useMemo(
    () => filtered ?? groups.flatMap((g) => g.icons),
    [filtered, groups],
  );

  const hasMore = visibleNames.some((n) => !bodies[n] && !failedBodies[n]);

  /* ── Carrega a collection completa (só nomes) ao trocar de set ──── */
  const loadCollection = useCallback(
    async (set: IconSetInfo) => {
      setLoading(true);
      setError(null);
      setBodies({});
      setFailedBodies({});
      try {
        // Community usa endpoint diferente
        const coll: IconCollection = set.prefix === 'community'
          ? await fetchCommunityIcons()
          : await fetchSetCollection(set.prefix);

        // Constrói grupos: categorias primeiro, depois "Outros/Todos".
        // Embaralha os ícones de cada grupo para variar a cada carga.
        const newGroups: IconGroup[] = [];
        if (coll.categories) {
          for (const [catName, icons] of Object.entries(coll.categories)) {
            newGroups.push({ name: catName, icons: shuffle(icons) });
          }
        }
        if (coll.uncategorized && coll.uncategorized.length > 0) {
          const label = newGroups.length > 0 ? 'Outros' : 'Todos';
          newGroups.push({ name: label, icons: shuffle(coll.uncategorized) });
        }
        setGroups(newGroups);

        // Auto-load first batch of SVGs immediately.
        const allNames = newGroups.flatMap((g) => g.icons);
        const firstBatch = allNames.slice(0, BODY_BATCH);
        if (firstBatch.length > 0) {
          setLoadingBodies(true);
          try {
            // Community busca cada ícone individualmente
            if (set.prefix === 'community') {
              const result: Record<string, string> = {};
              const promises = firstBatch.map(async (id) => {
                try {
                  result[id] = await fetchCommunityIconSvg(id);
                } catch {
                  /* ignore */
                }
              });
              await Promise.all(promises);
              setBodies(result);
              setFailedBodies(Object.fromEntries(firstBatch.filter((id) => !result[id]).map((id) => [id, true])));
            } else {
              const result = await fetchIconBodies(set.prefix, firstBatch);
              setBodies(result);
              setFailedBodies(Object.fromEntries(firstBatch.filter((id) => !result[id]).map((id) => [id, true])));
            }
          } catch {
            /* ignore */
          } finally {
            setLoadingBodies(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar ícones.');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Carga inicial + ao trocar de set.
  useEffect(() => {
    const prefix = selectedSet.prefix;
    const timer = window.setTimeout(() => {
      if (requestedSetRef.current === prefix) return;
      requestedSetRef.current = prefix;
      void loadCollection(selectedSet);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedSet, loadCollection]);

  useEffect(() => {
    fetchAvailableSets().then((sets) => {
      const community = CURATED_SETS.find((set) => set.prefix === 'community');
      window.setTimeout(() => setAvailableSets(community ? [...sets, community] : sets), 0);
    }).catch(() => {
      // Keep the local fallback when the catalog endpoint is unavailable.
    });
  }, []);

  /* ── Carregar próximo batch de bodies (botão "Ver mais") ──────────── */
  const loadMoreBodies = useCallback(async () => {
    if (loadingBodies) return;
    // Compute fresh pending list inside the callback to avoid stale closure.
    const pending = visibleNames.filter((n) => !bodies[n] && !failedBodies[n]).slice(0, BODY_BATCH);
    if (pending.length === 0) return;
    setLoadingBodies(true);
    try {
      // Community busca cada ícone individualmente
      if (selectedSet.prefix === 'community') {
        const result: Record<string, string> = {};
        const BATCH = 10;
        for (let i = 0; i < pending.length; i += BATCH) {
          const batch = pending.slice(i, i + BATCH);
          const promises = batch.map(async (id) => {
            try {
              result[id] = await fetchCommunityIconSvg(id);
            } catch {
              /* ignore */
            }
          });
          await Promise.all(promises);
        }
        setBodies((prev) => ({ ...prev, ...result }));
        setFailedBodies((prev) => ({ ...prev, ...Object.fromEntries(pending.filter((id) => !result[id]).map((id) => [id, true])) }));
      } else {
        const result = await fetchIconBodies(selectedSet.prefix, pending);
        setBodies((prev) => ({ ...prev, ...result }));
      }
    } catch {
      /* ignore — mantém o que já carregou */
    } finally {
      setLoadingBodies(false);
    }
  }, [loadingBodies, visibleNames, bodies, failedBodies, selectedSet]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleSetChange = useCallback((set: IconSetInfo) => {
    setSelectedSet(set);
    setSetMenuOpen(false);
    setQuery('');
  }, []);

  const handlePick = useCallback(
    async (name: string) => {
      try {
        // Community usa endpoint diferente
        const svg = selectedSet.prefix === 'community'
          ? await fetchCommunityIconSvg(name)
          : await fetchIconSvg(selectedSet.prefix, name);
        onPickIcon(svg, `${selectedSet.prefix}-${name}.svg`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar ícone.');
      }
    },
    [onPickIcon, selectedSet],
  );

  const handleClearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const loadedCount = useMemo(
    () => visibleNames.filter((n) => bodies[n]).length,
    [visibleNames, bodies],
  );

  /* ── Render de um grid de ícones ───────────────────────────────── */
  const renderIconGrid = (icons: string[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
      {icons
        .filter((name) => bodies[name])
        .map((name) => (
          <button
            key={name}
            onClick={() => void handlePick(name)}
            title={`${name} · clique para usar no editor`}
             className="aspect-square flex items-center justify-center p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
             <span
               className="w-3/4 h-3/4 [&_svg]:w-full [&_svg]:h-full"
               dangerouslySetInnerHTML={{ __html: scopeSvgIds(bodies[name], name) }}
             />
          </button>
        ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      {/* Header: seletor de conjunto + busca */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setSetMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
          >
            <Library className="w-3.5 h-3.5" />
            {selectedSet.name}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {setMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setSetMenuOpen(false)} />
              <div className="absolute z-30 mt-1 left-0 min-w-56 max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
                {availableSets.map((s) => (
                  <button
                    key={s.prefix}
                    onClick={() => handleSetChange(s)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${
                      s.prefix === selectedSet.prefix
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0">{s.total}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar em ${selectedSet.name}…`}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-400 rounded-lg text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-[10px] text-zinc-400 mb-2 flex items-center justify-between">
        <span>
          {loading
            ? 'Carregando…'
            : visibleNames.length > 0
              ? `${visibleNames.length} ícone${visibleNames.length !== 1 ? 's' : ''} · ${selectedSet.license}`
              : error
                ? '—'
                : 'Selecione um conjunto'}
        </span>
        {hasMore && <span>{loadedCount}/{visibleNames.length}</span>}
      </div>

      {/* Lista de ícones */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-2">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg mb-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Carregando ícones…</span>
          </div>
        ) : filtered ? (
          /* Modo busca: grid único dos resultados filtrados */
          <>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;
            </p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">Nenhum ícone encontrado.</span>
              </div>
            ) : (
              renderIconGrid(filtered)
            )}
          </>
        ) : (
          /* Modo normal: grupos por categoria */
          groups.map((group) => {
            const groupLoaded = group.icons.filter((n) => bodies[n]);
            if (groupLoaded.length === 0) return null;
            return (
              <div key={group.name} className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {group.name}
                  <span className="ml-1.5 text-zinc-300 dark:text-zinc-600 font-normal">
                    {group.icons.length}
                  </span>
                </p>
                {renderIconGrid(group.icons)}
              </div>
            );
          })
        )}

        {/* Botão "Ver mais" para carregar mais ícones */}
        {hasMore && !loading && (
          <div className="py-4 flex justify-center">
            <button
              onClick={() => void loadMoreBodies()}
              disabled={loadingBodies}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingBodies ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Carregando…
                </>
              ) : (
                <>
                  Ver mais
                  <span className="text-zinc-400 dark:text-zinc-500">
                    ({loadedCount}/{visibleNames.length})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
