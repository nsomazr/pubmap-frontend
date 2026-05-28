/** Strip LaTeX from titles and other plain-text labels (preview, PDF, map cards). */

const LATEX_CMD_WITH_BRACE = /\\(?:textbf|textit|emph|text|mathrm|mathbf|mathit|textrm)\{([^}]*)\}/gi;
const LATEX_CMD_GENERIC = /\\[a-zA-Z@]+(\[[^\]]*\])?(\{[^}]*\})?/g;
const DISPLAY_MATH = /\$\$[\s\S]*?\$\$/g;
const INLINE_MATH = /(?<!\\)\$(?!\$)([^\n$]+?)(?<!\\)\$/g;

function inlineMathToPlain(body: string): string {
  let chunk = body.trim();
  chunk = chunk.replace(LATEX_CMD_WITH_BRACE, "$1");
  chunk = chunk.replace(LATEX_CMD_GENERIC, " ");
  chunk = chunk.replace(/[{}_^\\]/g, " ");
  return chunk.replace(/\s+/g, " ").trim();
}

export function stripLatexForPlainText(value: string): string {
  let text = (value || "").trim();
  if (!text) return "";

  const titleMatch = text.match(/^\\title\{([\s\S]+)\}$/i);
  if (titleMatch) text = titleMatch[1].trim();

  text = text.replace(DISPLAY_MATH, " ");
  text = text.replace(INLINE_MATH, (_, inner: string) => {
    const plain = inlineMathToPlain(inner);
    return plain ? ` ${plain} ` : " ";
  });
  text = text.replace(LATEX_CMD_WITH_BRACE, "$1");
  text = text.replace(LATEX_CMD_GENERIC, " ");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/[_^\\]/g, " ");
  return text.replace(/\s+/g, " ").trim();
}
