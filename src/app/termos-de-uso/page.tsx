import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos de uso do Espremer — condições gerais de utilização da plataforma.',
};

export default function TermosDeUsoPage() {
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
        Termos de Uso
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            1. Aceitação dos Termos
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ao acessar e utilizar o Espremer, você concorda com estes Termos de Uso. Caso não
            concorde com algum dos termos, não utilize a plataforma. Reservamo-nos o direito de
            alterar estes termos a qualquer momento, sendo responsabilidade do usuário verificar
            periodicamente as atualizações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            2. Descrição do Serviço
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer é uma ferramenta de otimização de imagens e SVGs que processa arquivos
            <strong> integralmente no navegador do usuário</strong>. Não há envio de dados para
            servidores externos durante o processamento. O serviço inclui:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>Compressão de imagens (JPEG, PNG, WebP, AVIF, GIF)</li>
            <li>Otimização de SVGs com SVGO</li>
            <li>Edição de código SVG</li>
            <li>Biblioteca de ícones de terceiros</li>
            <li>Compartilhamento de ícones</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            3. Consentimento do Usuário
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ao utilizar o Espremer, você consente com:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>O armazenamento de preferências no <code>localStorage</code> do navegador</li>
            <li>O armazenamento de ícones compartilhados no servidor (quando aplicável)</li>
            <li>O tratamento de dados conforme descrito na nossa Política de Privacidade</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Você pode revogar seu consentimento a qualquer momento, incluindo a limpeza dos dados
            do navegador ou solicitação de remoção de compartilhamentos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            4. Uso Aceitável
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Você concorda em utilizar o Espremer apenas para fins lícitos. É proibido:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>Utilizar a plataforma para fins ilegais ou não autorizados</li>
            <li>Tentar acessar áreas restritas da plataforma sem autorização</li>
            <li>Interferir no funcionamento da plataforma ou em seus servidores</li>
            <li>Compartilhar conteúdo que viole direitos de terceiros</li>
            <li>Utilizar a plataforma para distribuir malware ou vírus</li>
            <li>Realizar engenharia reversa do código-fonte da plataforma</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            5. Propriedade Intelectual
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O código-fonte do Espremer está disponível sob licença open-source. Os ícones
            incluídos na biblioteca são de terceiros e estão sujeitos às suas respectivas licenças:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>Lucide — Licença ISC</li>
            <li>Tabler Icons — Licença MIT</li>
            <li>Heroicons — Licença MIT</li>
            <li>Remix Icon — Licença Apache 2.0</li>
            <li>Boxicons — Licença MIT</li>
            <li>Bootstrap Icons — Licença MIT</li>
            <li>Iconoir — Licença MIT</li>
            <li>Myna UI — Licença MIT</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            6. Compartilhamento de Ícones
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ao compartilhar um ícone na plataforma, você declara e garante que:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li>Possui o direito de compartilhar o conteúdo</li>
            <li>O conteúdo não viola direitos autorais, marcas registradas ou outros direitos de terceiros</li>
            <li>O conteúdo não é ofensivo, difamatório, obsceno ou ilegal</li>
            <li>O conteúdo não contém vírus ou código malicioso</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Ícones compartilhados como &ldquo;públicos&rdquo; (sem expiração) ficarão disponíveis
            na seção &ldquo;Community&rdquo; da biblioteca de ícones. O autor pode solicitar a
            remoção a qualquer momento através da página de{' '}
            <Link href="/remocao" className="text-blue-500 hover:text-blue-600 underline">
              solicitação de remoção
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            7. Conformidade com a LGPD
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer opera em conformidade com a Lei Geral de Proteção de Dados (LGPD -
            Lei nº 13.709/2018). Nossas práticas incluem:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Minimização de dados:</strong> coletamos apenas os dados estritamente necessários</li>
            <li><strong>Finalidade:</strong> os dados são utilizados apenas para as finalidades informadas</li>
            <li><strong>Segurança:</strong> adotamos medidas técnicas e administrativas para proteger os dados</li>
            <li><strong>Transparência:</strong> informamos claramente sobre o tratamento de dados</li>
            <li><strong>Direitos do titular:</strong> você pode exercer seus direitos a qualquer momento</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Para mais informações, consulte nossa{' '}
            <Link href="/privacidade" className="text-blue-500 hover:text-blue-600 underline">
              Política de Privacidade
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            8. Retenção e Exclusão de Dados
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Os dados são tratados conforme os seguintes prazos:
          </p>
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
            <li><strong>Dados do navegador:</strong> permanecem até que você limpe os dados do site</li>
            <li><strong>Ícones com expiração:</strong> são automaticamente removidos na data indicada</li>
            <li><strong>Ícones públicos:</strong> permanecem até solicitação de remoção</li>
            <li><strong>Formulários de contato:</strong> são retidos por até 12 meses</li>
          </ul>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Você pode solicitar a exclusão de seus dados a qualquer momento através da nossa{' '}
            <Link href="/contato" className="text-blue-500 hover:text-blue-600 underline">
              página de contato
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            9. Isenção de Responsabilidade
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer é fornecido &ldquo;como está&rdquo;, sem garantias de qualquer tipo. Não
            garantimos que a plataforma será ininterrupta, livre de erros ou segura. O usuário é
            responsável por fazer backup de seus arquivos antes de utilizá-los na plataforma.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Em nenhum caso o Espremer será responsável por danos diretos, indiretos, incidentais,
            especiais ou consequenciais decorrentes do uso ou impossibilidade de uso da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            10. Limitação de Responsabilidade
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Em máxima extensão permitida pela lei aplicável, a responsabilidade total do Espremer
            por quaisquer reclamações decorrentes destes Termos ou do uso da plataforma será
            limitada ao valor pago pelo usuário, se houver, nos 12 meses anteriores à reclamação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            11. Links de Terceiros
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            O Espremer pode conter links para sites de terceiros. Esses links são fornecidos
            apenas para conveniência. Não temos controle sobre o conteúdo desses sites e não
            assumimos responsabilidade por seu conteúdo, políticas de privacidade ou práticas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            12. Suspensão ou Encerramento
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Reservamo-nos o direito de suspender ou encerrar o acesso à plataforma a qualquer
            momento, sem aviso prévio, por qualquer motivo, incluindo mas não se limitando a
            violações destes Termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            13. Lei Aplicável e Foro
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer
            controvérsia decorrente destes termos será submetida ao foro da comarca de São Paulo,
            Estado de São Paulo, com exclusão de qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            14. Alterações nestes Termos
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Estes Termos de Uso podem ser atualizados periodicamente. Alterações significativas
            serão comunicadas através da plataforma. O uso continuado da plataforma após as
            alterações constitui aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
            15. Contato
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Em caso de dúvidas sobre estes Termos de Uso ou para exercer seus direitos como
            titular dos dados, entre em contato através da nossa página de{' '}
            <Link href="/contato" className="text-blue-500 hover:text-blue-600 underline">
              contato
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
