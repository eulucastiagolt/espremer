/**
 * Inicializa o Prism e expõe `highlightSvg` para realçar markup SVG.
 *
 * O Prism é carregado uma única vez (módulo client). Importamos o core,
 * o componente `prism-markup` (que cobre XML/SVG) e devolvemos uma função
 * pura que o react-simple-code-editor usa como `highlight`.
 */
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';

/**
 * Realça uma string de markup SVG/XML retornando HTML com spans Prism.
 * Usado pelo `highlight` do react-simple-code-editor.
 */
export function highlightSvg(code: string): string {
  if (!code) return '';
  try {
    return Prism.highlight(code, Prism.languages.markup, 'markup');
  } catch {
    // Fallback seguro: escapa HTML para não quebrar a renderização.
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
