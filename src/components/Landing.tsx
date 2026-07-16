'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Image as ImageIcon, Spline, Film, Zap, Shield, Gauge, Lock } from 'lucide-react';

type Tool = {
  href?: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  formats: string[];
  comingSoon?: boolean;
  badge?: string;
};

const tools: Tool[] = [
  {
    href: '/images',
    title: 'Imagens',
    description: 'Comprima JPEG, PNG, WebP, AVIF e GIF com comparação visual e download em lote.',
    icon: ImageIcon,
    formats: ['JPEG', 'PNG', 'WebP', 'AVIF', 'GIF'],
  },
  {
    href: '/svg',
    title: 'SVG',
    description: 'Otimize com SVGO, edite o código, transforme e exporte para PNG ou Data URI.',
    icon: Spline,
    formats: ['SVGO', 'Editor', 'PNG', 'Data URI'],
  },
  {
    title: 'Vídeos',
    description: 'Comprima MP4 e WebM com FFmpeg nativo — qualidade ou tamanho-alvo, via app desktop.',
    icon: Film,
    formats: ['MP4', 'WebM', 'FFmpeg'],
    comingSoon: true,
    badge: 'Em breve · Desktop',
  },
];

const features = [
  {
    icon: Lock,
    title: 'Privacidade Total',
    description: 'Seus arquivos nunca saem do navegador. Nenhum upload, nenhum servidor.',
  },
  {
    icon: Zap,
    title: 'Velocidade Instantânea',
    description: 'Processamento local com WASM e Web Workers. Resultados em milissegundos.',
  },
  {
    icon: Shield,
    title: 'Sem Upload',
    description: 'Tudo acontece no seu dispositivo. Funciona até offline depois de carregado.',
  },
  {
    icon: Gauge,
    title: 'Multi-formato',
    description: 'Imagens raster, GIFs animados e SVGs vetoriais em um só lugar.',
  },
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
              Esprema seus arquivos
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                {' '}ao máximo
              </span>
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
              Otimizador de imagens e SVGs que roda 100% no seu navegador.
              Sem upload, sem espera, sem compromisso com privacidade.
            </p>
          </motion.div>

          {/* Tool cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {tools.map((tool, index) => {
              const inner = (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-600/20 transition-colors">
                      <tool.icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {tool.title}
                    </h3>
                    {tool.badge && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </>
              );

              const cardClass = `block text-left p-6 rounded-2xl border transition-all group h-full ${
                tool.comingSoon
                  ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-dashed border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
              }`;

              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  {tool.href ? (
                    <Link href={tool.href} className={cardClass}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={cardClass} aria-disabled="true">
                      {inner}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Why Espremer? */}
      <section className="py-16 sm:py-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight text-center mb-10"
          >
            Por que Espremer?
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
