import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imagens',
  description:
    'Comprima JPEG, PNG, WebP, AVIF e GIF 100% no navegador. Sem upload, sem espera, sem comprometer privacidade.',
};

export default function ImagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
