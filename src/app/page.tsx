import type { Metadata } from 'next';
import Landing from '@/components/Landing';

export const metadata: Metadata = {
  description:
    'Espremer — otimizador de imagens e SVGs que roda 100% no navegador. Comprima JPEG, PNG, WebP, AVIF, GIF e SVG sem upload.',
};

export default function Home() {
  return <Landing />;
}
