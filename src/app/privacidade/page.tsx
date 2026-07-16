import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de privacidade do Espremer — processamento 100% no navegador, sem upload de dados.',
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Política de Privacidade
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            1. Controlador dos Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer é uma ferramenta open-source. Não há uma empresa ou pessoa física
            identificável como controladora dos dados, uma vez que todo o processamento ocorre
            localmente no navegador do usuário. Os dados de compartilhamento de ícones são
            armazenados em servidores cuja operação é responsabilidade dos mantenedores do projeto.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            2. Coleta de Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer é uma ferramenta que roda <strong>100% no navegador</strong>. Nenhum dado
            pessoal, imagem ou SVG é enviado para servidores externos durante o processamento.
            Todo o processamento (compressão de imagens, otimização de SVGs) acontece localmente
            no seu dispositivo.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Os seguintes dados podem ser coletados apenas quando você utiliza funcionalidades
            específicas:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Compartilhamento de ícones:</strong> código SVG, nome do arquivo, data de criação e expiração</li>
            <li><strong>Formulário de contato:</strong> nome, e-mail e mensagem (apenas quando enviado)</li>
            <li><strong>Solicitação de remoção:</strong> ID do compartilhamento, motivo e e-mail opcional</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            3. Base Legal (Art. 7º da LGPD)
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O tratamento de dados é realizado com base nas seguintes bases legais da LGPD:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Consentimento (Art. 7º, I):</strong> quando você compartilha um ícone ou envia um formulário</li>
            <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para melhoria da plataforma e prevenção de fraude</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> para fornecer os serviços solicitados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            4. Direitos do Titular dos Dados (Art. 18 da LGPD)
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Confirmação da existência de tratamento</strong> de dados pessoais</li>
            <li><strong>Acesso aos dados</strong> tratados sobre você</li>
            <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários ou excessivos</li>
            <li><strong>Portabilidade</strong> dos dados a outro fornecedor de serviço</li>
            <li><strong>Eliminação</strong> dos dados pessoais tratados com seu consentimento</li>
            <li><strong>Informação sobre entidades</strong> com quem houve compartilhamento de dados</li>
            <li><strong>Revogação do consentimento</strong> a qualquer momento</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Para exercer seus direitos, entre em contato através da nossa página de{' '}
            <Link href="/contato" className="text-blue-500 hover:text-blue-600 underline">
              contato
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            5. Armazenamento Local
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer utiliza <code>localStorage</code> do navegador para:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>Salvar suas preferências de tema (claro/escuro/sistema)</li>
            <li>Cachear configurações de otimização</li>
            <li>Cachear ícones já visualizados para navegação mais rápida</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Esses dados permanecem apenas no seu navegador e podem ser apagados a qualquer momento
            limpando os dados do site nas configurações do navegador.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            6. Retenção de Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Os dados são retidos pelo seguinte período:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Dados do navegador (localStorage):</strong> até que o usuário limpe os dados do site</li>
            <li><strong>Ícones compartilhados com expiração:</strong> até a data de expiração</li>
            <li><strong>Ícones compartilhados como públicos:</strong> até solicitação de remoção</li>
            <li><strong>Formulários de contato:</strong> até 12 meses após o atendimento</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            7. Compartilhamento de Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            A funcionalidade de compartilhamento de ícones armazena o conteúdo SVG compartilhado em
            nosso servidor. Os dados compartilhados incluem:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>O código SVG em si</li>
            <li>Data de criação</li>
            <li>Data de expiração (quando aplicável)</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Ícones compartilhados com expiração são automaticamente removidos após o período
            especificado. Ícones compartilhados como &ldquo;públicos&rdquo; (sem expiração) ficam
            disponíveis publicamente e podem ser removidos por solicitação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            8. Transferência Internacional de Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer não realiza transferência internacional de dados. Todo o processamento
            ocorre localmente no dispositivo do usuário. Os dados de compartilhamento podem ser
            armazenados em servidores localizados no Brasil.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            9. Bibliotecas de Ícones
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer inclui ícones de bibliotecas de terceiros com licenças permissivas:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Lucide</strong> — Licença ISC</li>
            <li><strong>Tabler Icons</strong> — Licença MIT</li>
            <li><strong>Heroicons</strong> — Licença MIT</li>
            <li><strong>Remix Icon</strong> — Licença Apache 2.0</li>
            <li><strong>Boxicons</strong> — Licença MIT</li>
            <li><strong>Bootstrap Icons</strong> — Licença MIT</li>
            <li><strong>Iconoir</strong> — Licença MIT</li>
            <li><strong>Myna UI</strong> — Licença MIT</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Esses ícones são armazenados localmente e servidos pela nossa API interna. Nenhum dado
            é enviado para os mantenedores dessas bibliotecas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            10. Cookies
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer não utiliza cookies. Todas as preferências são armazenadas via{' '}
            <code>localStorage</code>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            11. Serviços de Terceiros
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer não integra serviços de terceiros que coletam dados, como Google Analytics,
            Facebook Pixel ou similares. Não existem rastreadores ou pixels de monitoramento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            12. Segurança
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Como todo o processamento ocorre localmente, o risco de exposição de dados é
            significativamente reduzido. Não há transmissão de dados pela internet durante o
            processamento de imagens e SVGs. Adotamos medidas técnicas e administrativas para
            proteger os dados armazenados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            13. Menores de Idade
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer não é direcionado a menores de 16 anos. Não coletamos intencionalmente
            dados pessoais de menores. Se tomarmos conhecimento de que coletamos dados de um
            menor, tomaremos providências para deletar essas informações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            14. Alterações nesta Política
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Esta política pode ser atualizada periodicamente. Alterações significativas serão
            refletidas na data de &ldquo;Última atualização&rdquo; acima e comunicadas através
            da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            15. Contato e Encarregado
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Em caso de dúvidas sobre esta política de privacidade ou para exercer seus direitos
            como titular dos dados, entre em contato através da nossa página de{' '}
            <Link href="/contato" className="text-blue-500 hover:text-blue-600 underline">
              contato
            </Link>.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Para solicitações de remoção de compartilhamentos públicos, utilize a página de{' '}
            <Link href="/remocao" className="text-blue-500 hover:text-blue-600 underline">
              solicitação de remoção
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
