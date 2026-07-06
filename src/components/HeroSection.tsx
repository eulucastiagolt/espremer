'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, Gauge, Image as ImageIcon } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Compressão Instantânea',
    description: 'Processamento direto no navegador, sem upload para servidores.',
  },
  {
    icon: Shield,
    title: 'Privacidade Total',
    description: 'Suas imagens nunca saem do seu computador.',
  },
  {
    icon: Gauge,
    title: 'Formatos Modernos',
    description: 'Suporte a JPEG, PNG, WebP, AVIF e GIF.',
  },
  {
    icon: ImageIcon,
    title: 'Otimização de GIFs',
    description: 'Comprima e otimize animações com controle de frames e lossy.',
  },
];

export default function HeroSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
            Esprema suas imagens
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              {' '}ao máximo
            </span>
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
            Otimizador de imagens e GIFs que roda 100% no seu navegador.
            Sem upload, sem espera, sem compromisso com privacidade.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
