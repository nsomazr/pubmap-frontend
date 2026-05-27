import katex from "katex";
import { marked } from "marked";
import {
  hasStructuredHtmlBlocks,
  isManuscriptHtml,
  looksLikeFormulaLine,
  markdownishFromExtractedText,
  prepareManuscriptSource,
} from "./manuscriptMarkdown";
import { sanitizeManuscriptHtml } from "./sanitizeHtml";

marked.setOptions({
  gfm: true,
  breaks: true,
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
  const parsed = marked.parse(text);
  const html = typeof parsed === "string" ? parsed : String(parsed);
  return restoreMathPlaceholders(html, placeholders);
}

function renderStructuredHtmlWithMath(source: string): string {
  const { text, placeholders } = extractMathPlaceholders(source);
  return restoreMathPlaceholders(text, placeholders);
}

/** Render manuscript field content (markdown, LaTeX, or CKEditor HTML) for preview and reading. */
export function renderManuscriptHtml(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";

  let html = "";
  if (isManuscriptHtml(raw) && hasStructuredHtmlBlocks(raw)) {
    html = renderStructuredHtmlWithMath(raw);
  } else {
    const markdown = isManuscriptHtml(raw)
      ? prepareManuscriptSource(raw)
      : markdownishFromExtractedText(raw);
    html = renderMarkdownWithMath(markdown);
  }

  return sanitizeManuscriptHtml(html);
}

export function hasManuscriptContent(value?: string | null): boolean {
  return Boolean((value || "").trim());
}

export { looksLikeFormulaLine };
