'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import {
  SVG_PLUGINS_BY_GROUP,
  SVG_PLUGINS,
  PRESET_DEFAULT_PLUGINS,
  PRESET_STRONG_EXTRA,
} from '@/lib/svg-plugins';
import type { SvgOptimizationConfig, SvgPreset } from '@/lib/svg-types';

interface SvgOptimizationPanelProps {
  config: SvgOptimizationConfig;
  onChange: (config: SvgOptimizationConfig) => void;
  /**
   * Quando true, omite o wrapper de card (borda + fundo + padding externo)
   * — usado ao embutir o painel dentro de um Dropdown.
   */
  embedded?: boolean;
}

const PRESETS: { value: SvgPreset; label: string }[] = [
  { value: 'off', label: 'Desativado' },
  { value: 'default', label: 'Padrão' },
  { value: 'strong', label: 'Forte' },
];

export default function SvgOptimizationPanel({
  config,
  onChange,
  embedded = false,
}: SvgOptimizationPanelProps) {
  const [showPlugins, setShowPlugins] = useState(false);

  /** Mapa nome→enabled dos toggles (inclui todos os plugins conhecidos). */
  const toggleMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of SVG_PLUGINS) {
      const explicit = config.plugins.find((t) => t.name === p.name);
      if (explicit !== undefined) {
        map.set(p.name, explicit.enabled);
      } else {
        // Default state deriva do preset.
        if (config.preset === 'default' || config.preset === 'strong') {
          map.set(p.name, PRESET_DEFAULT_PLUGINS.has(p.name));
        }
        if (config.preset === 'strong') {
          map.set(p.name, PRESET_DEFAULT_PLUGINS.has(p.name) || PRESET_STRONG_EXTRA.includes(p.name));
        }
        if (config.preset === 'off') {
          map.set(p.name, false);
        }
      }
    }
    return map;
  }, [config.plugins, config.preset]);

  const setPreset = (preset: SvgPreset) => {
    // Ao trocar de preset, limpa os toggles explícitos para herdar o preset.
    onChange({ ...config, preset, plugins: [] });
  };

  const togglePlugin = (name: string) => {
    const current = toggleMap.get(name) ?? false;
    // Mantém todos os overrides explícitos + este.
    const others = config.plugins.filter((t) => t.name !== name);
    onChange({
      ...config,
      plugins: [...others, { name, enabled: !current }],
    });
  };

  const updateField = <K extends keyof SvgOptimizationConfig>(
    key: K,
    value: SvgOptimizationConfig[K],
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div
      className={
        embedded
          ? 'p-4 space-y-4'
          : 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4'
      }
    >
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Otimização (SVGO)
        </h3>
      </div>

      {/* Preset */}
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
          Preset
        </label>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                config.preset === p.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controles globais */}
      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
        <label className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Multipass</span>
          <input
            type="checkbox"
            checked={config.multipass}
            onChange={(e) => updateField('multipass', e.target.checked)}
            className="accent-blue-500"
          />
        </label>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            Precisão numérica: {config.floatPrecision}
          </label>
          <input
            type="range"
            min={0}
            max={6}
            value={config.floatPrecision}
            onChange={(e) => updateField('floatPrecision', Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <label className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Formatar saída (prettify)</span>
          <input
            type="checkbox"
            checked={config.pretty}
            onChange={(e) => updateField('pretty', e.target.checked)}
            className="accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">Comparar com gzip</span>
          <input
            type="checkbox"
            checked={config.compareGzip}
            onChange={(e) => updateField('compareGzip', e.target.checked)}
            className="accent-blue-500"
          />
        </label>
      </div>

      {/* Plugins individuais */}
      <div>
        <button
          onClick={() => setShowPlugins(!showPlugins)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          {showPlugins ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Plugins individuais ({SVG_PLUGINS.length})
        </button>

        <AnimatePresence>
          {showPlugins && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-3 max-h-72 overflow-y-auto pr-1">
                {Object.entries(SVG_PLUGINS_BY_GROUP).map(([group, plugins]) => (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-zinc-400 mb-1">
                      {group}
                    </p>
                    <div className="space-y-1">
                      {plugins.map((p) => {
                        const checked = toggleMap.get(p.name) ?? false;
                        return (
                          <label
                            key={p.name}
                            title={p.description}
                            className="flex items-start gap-2 p-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePlugin(p.name)}
                              className="mt-0.5 accent-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 leading-tight">
                                {p.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
