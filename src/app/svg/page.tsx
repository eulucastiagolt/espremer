import type { Metadata } from 'next';
import SvgTool from '@/components/svg/SvgTool';

export const metadata: Metadata = {
  title: 'SVG',
  description:
    'Otimize SVGs com SVGO, edite o código, aplique transformações e exporte para PNG ou Data URI — 100% no navegador.',
};

export default function SvgPage() {
  return <SvgTool />;
}
