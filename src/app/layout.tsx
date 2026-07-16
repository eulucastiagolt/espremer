import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import MaintenanceGate from "@/components/MaintenanceGate";

export const metadata: Metadata = {
  title: {
    template: "%s — Espremer",
    default: "Espremer — Otimizador de Imagens e SVG",
  },
  description:
    "Otimizador de imagens e SVGs que roda 100% no navegador. Sem upload, sem espera, sem compromisso com privacidade.",
  keywords:
    "image compressor, image optimizer, GIF compressor, SVG optimizer, SVGO, client-side, browser",
};

/** Script inline que aplica o tema antes da hidratação (evita flash). */
const NO_FLASH_THEME_SCRIPT = `try{var t=localStorage.getItem('espremer-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <Providers>
          <ThemeProvider>
           <MaintenanceGate>
             <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
               <Header />
               <main className="flex-1">{children}</main>
               <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
                  <p className="text-sm text-zinc-400">
                    Espremer — Processamento 100% no navegador. Nenhum dado é
                    enviado para servidores.
                  </p>
                  <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <Link href="/privacidade" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      Política de Privacidade
                    </Link>
                    <Link href="/termos-de-uso" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      Termos de Uso
                    </Link>
                    <Link href="/contato" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      Contato
                    </Link>
                    <Link href="/remocao" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                      Solicitar Remoção
                    </Link>
                  </div>
                </div>
               </footer>
             </div>
           </MaintenanceGate>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
