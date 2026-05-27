import katex from "katex";
import { marked } from "marked";
import {
  isLikelyRenderableLatex,
  looksLikeFormulaLine,
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

function repairLatexEnvironments(latex: string): string {
  let body = latex;
  if (/\\begin\{array\}/i.test(body) && /\\end\{aligned\}/i.test(body)) {
    body = body.replace(/\\begin\{array\}(\{[^}]*\})?/gi, "\\begin{aligned}");
  }
  if (/\\begin\{aligned\}/i.test(body) && /\\end\{array\}/i.test(body)) {
    body = body.replace(/\\end\{array\}/gi, "\\end{aligned}");
  }
  return body;
}

function normalizeLatexSnippet(latex: string): { body: string; tag?: string } {
  const tagMatch = latex.match(/\\tag\{([^}]+)\}/);
  const tag = tagMatch?.[1]?.trim();
  let body = latex.replace(/\\tag\{[^}]+\}/g, "").trim();
  body = repairLatexEnvironments(body);
  // OCR / JSON-escaped outputs often produce "\\left" or "\ theta".
  body = body.replace(/\\\\([A-Za-z]+)/g, "\\$1");
  body = body.replace(/\\\s+([A-Za-z]+)/g, "\\$1");
  body = body.replace(/\\begin\{array\}\s*\{\s*rl\s*\}/gi, "\\begin{aligned}");
  body = body.replace(/\\end\{array\}/gi, "\\end{aligned}");
  body = body.replace(/\{\\underline\{\{\\array\}\}\}/g, "");
  body = body.replace(/\\mathbb\s+\{\s*([^}]+)\s*\}/g, "\\mathbb{$1}");
  body = body.replace(/\\mathbf\s+\{\s*([^}]+)\s*\}/g, "\\mathbf{$1}");
  body = body.replace(/\\mathrm\s+\{\s*([^}]+)\s*\}/g, "\\mathrm{$1}");
  body = body.replace(/_\s*\{\s*([^}]+)\s*\}/g, "_{$1}");
  body = body.replace(/\^\s*\{\s*([^}]+)\s*\}/g, "^{$1}");
  return { body, tag };
}

function latexFallbackHtml(latex: string, displayMode: boolean, tag?: string): string {
  const tagHtml = tag ? `<span class="eq-tag">(${escapeHtml(tag)})</span>` : "";
  if (displayMode) {
    return `<pre class="latex-fallback latex-fallback-block">${escapeHtml(latex)}</pre>${tagHtml}`;
  }
  return `<code class="latex-fallback">${escapeHtml(latex)}</code>${tagHtml}`;
}

function renderLatex(latex: string, displayMode: boolean): string {
  const { body, tag } = normalizeLatexSnippet(latex);
  if (!body) {
    return tag ? `<span class="eq-tag">(${escapeHtml(tag)})</span>` : "";
  }

  if (!isLikelyRenderableLatex(body)) {
    return latexFallbackHtml(body, displayMode, tag);
  }

  try {
    const html = katex.renderToString(body, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
    if (html.includes("katex-error")) {
      return latexFallbackHtml(body, displayMode, tag);
    }
    const tagHtml = tag ? `<span class="eq-tag">(${escapeHtml(tag)})</span>` : "";
    return html + tagHtml;
  } catch {
    return latexFallbackHtml(body, displayMode, tag);
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

function renderMarkdownWithMath(markdown: string): string {
  const { text, placeholders } = extractMathPlaceholders(markdown);
  const parsed = marked.parse(text);
  const html = typeof parsed === "string" ? parsed : String(parsed);
  return restoreMathPlaceholders(html, placeholders);
}

/** Render manuscript field content (markdown, LaTeX, or CKEditor HTML) for preview and reading. */
export function renderManuscriptHtml(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const markdown = prepareManuscriptSource(raw);
  return sanitizeManuscriptHtml(renderMarkdownWithMath(markdown));
}

export function hasManuscriptContent(value?: string | null): boolean {
  return Boolean((value || "").trim());
}

export { looksLikeFormulaLine };
