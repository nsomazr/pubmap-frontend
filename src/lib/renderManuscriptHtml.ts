import katex from "katex";
import { marked } from "marked";
import {
  isManuscriptHtml,
  markdownishFromExtractedText,
  looksLikeFormulaLine,
} from "./manuscriptMarkdown";
import { sanitizeManuscriptHtml } from "./sanitizeHtml";

marked.setOptions({
  gfm: true,
  breaks: false,
});

const MATH_PLACEHOLDER = "@@GRE_MATH_";

type MathPlaceholder = { html: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderLatex(latex: string, displayMode: boolean): string {
  const trimmed = latex.trim();
  if (!trimmed) return "";
  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return `<code class="latex-fallback">${escapeHtml(trimmed)}</code>`;
  }
}

function placeholderToken(index: number): string {
  return `${MATH_PLACEHOLDER}${index}@@`;
}

/** Pull LaTeX out of mixed text and leave tokens for later HTML injection. */
function extractMathPlaceholders(source: string): { text: string; placeholders: MathPlaceholder[] } {
  const placeholders: MathPlaceholder[] = [];

  const push = (latex: string, displayMode: boolean) => {
    const html = renderLatex(latex, displayMode);
    placeholders.push({ html });
    return placeholderToken(placeholders.length - 1);
  };

  let text = source.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => push(latex, true));

  text = text.replace(/(?<!\\)\$(?!\$)([^\n$]+?)(?<!\\)\$/g, (_, latex) => push(latex, false));

  return { text, placeholders };
}

function restoreMathPlaceholders(html: string, placeholders: MathPlaceholder[]): string {
  let output = html;
  placeholders.forEach((item, index) => {
    output = output.split(placeholderToken(index)).join(item.html);
  });
  return output;
}

function renderMarkdownWithMath(source: string): string {
  const { text, placeholders } = extractMathPlaceholders(source);
  const markdown = markdownishFromExtractedText(text);
  const parsed = marked.parse(markdown);
  const html = typeof parsed === "string" ? parsed : String(parsed);
  return restoreMathPlaceholders(html, placeholders);
}

function renderHtmlWithMath(source: string): string {
  const { text, placeholders } = extractMathPlaceholders(source);
  return restoreMathPlaceholders(text, placeholders);
}

/** Render manuscript field content (markdown, LaTeX, or CKEditor HTML) for preview and reading. */
export function renderManuscriptHtml(value?: string | null): string {
  const text = (value || "").trim();
  if (!text) return "";

  const html = isManuscriptHtml(text) ? renderHtmlWithMath(text) : renderMarkdownWithMath(text);
  return sanitizeManuscriptHtml(html);
}

/** True when the value is non-empty after trimming. */
export function hasManuscriptContent(value?: string | null): boolean {
  return Boolean((value || "").trim());
}

/** Used by extraction to decide whether a formula line should stay on its own paragraph. */
export { looksLikeFormulaLine };
