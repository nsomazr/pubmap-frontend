/** Helpers to turn extracted plain text or thin HTML into markdown-friendly source. */

export function looksLikeExtractedStructuralLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  if (/^\d+\s+of\s+\d+$/i.test(value)) return true;
  if (/^(?:keywords?|key\s+words?)\s*[:\-]/i.test(value)) return true;
  if (/^\s*(?:[-*+]|(?:\d+|[a-z])[\.\)])\s+/.test(value)) return true;
  if (
    /^\s*(?:abstract|summary|introduction|methods?|methodology|results?|findings?|discussion|conclusion|references?|bibliography)\b/i.test(
      value
    )
  ) {
    return true;
  }
  if (/(?:https?:\/\/doi\.org\/|doi:\s*)/i.test(value)) return true;
  return false;
}

const COMMON_ENGLISH_WORD =
  /\b(?:the|and|with|that|this|from|are|was|for|not|can|have|when|where|how|our|their|they|been|will|also|into|than|other|such|only|may|use|using|both|between|however|which|while|these|those|about|after|before|during|through|each|more|most|some|well|paper|model|data|training|method|learning|gradient|equation|estimate|sample|distribution|objective|approach|energy|based|noise|score|matching|expectation|empirical|average|observed|drawback|adding|regularity|negligible|straightforward|challenge|inconsistency|attenuate|approximated|samples)\b/i;

function countEnglishWords(line: string): { total: number; common: number } {
  const words = line.match(/\b[a-zA-Z]{2,}\b/g) || [];
  let common = 0;
  for (const word of words) {
    if (COMMON_ENGLISH_WORD.test(word)) common += 1;
  }
  return { total: words.length, common };
}

/** Restore spaces when OCR or HTML stripping glued words together. */
export function repairCollapsedWords(text: string): string {
  if (!text) return "";
  const spaces = (text.match(/\s/g) || []).length;
  const words = (text.match(/\b[a-zA-Z]{4,}\b/g) || []).length;
  if (spaces >= Math.max(4, words * 0.35)) return text;

  let repaired = text;
  repaired = repaired.replace(/([,.;:!?)])(?=[A-Za-z(])/g, "$1 ");
  repaired = repaired.replace(/(\))(?=[A-Za-z])/g, "$1 ");
  repaired = repaired.replace(/([a-z])([A-Z])/g, "$1 $2");
  repaired = repaired.replace(/([A-Z]{2,})([A-Z][a-z])/g, "$1 $2");
  return repaired.replace(/\s+/g, " ").trim();
}

export function isLikelyProse(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (/\\(?:begin|frac|nabla|int|sum|prod|sqrt|left|right|mathbb|mathrm|mathbf)\b/.test(value)) {
    return false;
  }
  const { total, common } = countEnglishWords(value);
  if (common >= 2) return true;
  if (total >= 8) return true;
  if (/\s/.test(value) && total >= 5) return true;
  return !/\s/.test(value) && value.length > 48 && total >= 6;
}

export function isLikelyRenderableLatex(latex: string): boolean {
  const value = latex.trim();
  if (!value) return false;
  if (/\\underline.*\\array/i.test(value) || /\{\{/.test(value)) return false;
  if (isLikelyProse(value)) return false;

  const open = (value.match(/\{/g) || []).length;
  const close = (value.match(/\}/g) || []).length;
  if (Math.abs(open - close) > 4) return false;

  // Allow command-heavy formulas even when OCR introduces many alpha tokens.
  if (/\\[A-Za-z]+/.test(value)) return true;

  const { total, common } = countEnglishWords(value);
  if (common >= 2 || total > 10) return false;

  return /\\|[\^_{}]|∫|∑|frac|nabla|mathbb|mathbf|left|right|begin|end|&|=/.test(value);
}

/** Remove $...$ / $$...$$ wrappers that were applied to prose by mistake. */
export function unwrapSpuriousMathDelimiters(text: string): string {
  let output = text.replace(/\$\$([\s\S]+?)\$\$/g, (_full, inner: string) => {
    const body = inner.trim();
    if (isLikelyRenderableLatex(body)) return `$$${inner}$$`;
    if (isLikelyProse(body) || isLikelyProse(repairCollapsedWords(body))) {
      return repairCollapsedWords(body);
    }
    return `$$${inner}$$`;
  });

  output = output.replace(/\$([^$\n]+)\$/g, (full, inner: string) => {
    const body = inner.trim();
    if (isLikelyRenderableLatex(body)) return full;
    if (isLikelyProse(body) || isLikelyProse(repairCollapsedWords(body))) {
      return repairCollapsedWords(body);
    }
    return full;
  });

  return output;
}

export function looksLikeFormulaLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  if (/(?<!\\)\$.*?(?<!\\)\$/.test(value)) return false;

  const { total, common } = countEnglishWords(value);
  if (common >= 2 || total >= 7) return false;

  if (/\\tag\{/.test(value) && !/\\begin/.test(value)) return false;

  if (/\\begin\{/.test(value) || /\\end\{/.test(value)) {
    return common === 0 && total <= 4;
  }

  if (
    /\\(?:frac|nabla|int|sum|prod|sqrt|left|right|mathbb|mathrm|mathbf|boldsymbol|hat|bar|vec|dot|ddot)\b/.test(
      value
    )
  ) {
    return common <= 1 && total <= 5;
  }

  if (/[&]{1,2}/.test(value) && /\\\\/.test(value)) return true;

  if (/^[A-Za-z0-9\\_{}^().,;=+\-/*|&\s[\]]+$/.test(value)) {
    const hasMath = /[=\\_^]|∫|∑/.test(value);
    if (hasMath && total <= 8 && common === 0) return true;
  }

  return false;
}

export function isMarkdownTableRow(line: string): boolean {
  const value = line.trim();
  if (!value.includes("|")) return false;
  const cells = value.split("|").map((cell) => cell.trim()).filter(Boolean);
  return cells.length >= 2;
}

export function isMarkdownTableSeparator(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line.trim());
}

export function isManuscriptHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function hasStructuredHtmlBlocks(html: string): boolean {
  return /<(h[1-6]|table|ul|ol|blockquote|thead|tbody)\b/i.test(html);
}

function getTextContent(el: Element): string {
  return (el.textContent || "").trim();
}

function needsSpaceBetween(prev: string, next: string): boolean {
  if (!prev || !next) return false;
  if (/\s$/.test(prev) || /^\s/.test(next)) return false;
  if (/^[,.;:!?)\]]/.test(next)) return false;
  if (/[([$\\]$/.test(prev)) return false;
  return true;
}

function joinInlineParts(parts: string[]): string {
  const merged: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const last = merged[merged.length - 1];
    if (last && needsSpaceBetween(last, part)) {
      merged.push(" ");
    }
    merged.push(part);
  }
  return merged.join("").replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function serializeInlineHtml(el: Element): string {
  const parts: string[] = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent || "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const child = node as Element;
    const tag = child.tagName.toLowerCase();
    if (tag === "br") {
      parts.push("\n");
      return;
    }
    if (tag === "strong" || tag === "b") {
      parts.push(`**${serializeInlineHtml(child)}**`);
      return;
    }
    if (tag === "em" || tag === "i") {
      parts.push(`*${serializeInlineHtml(child)}*`);
      return;
    }
    if (tag === "code") {
      parts.push(`\`${getTextContent(child)}\``);
      return;
    }
    parts.push(serializeInlineHtml(child));
  });
  return joinInlineParts(parts);
}

function tableElementToMarkdown(table: HTMLTableElement): string {
  const rows: string[][] = [];
  table.querySelectorAll("tr").forEach((tr) => {
    const cells = [...tr.querySelectorAll("th,td")].map((cell) =>
      (cell.textContent || "").trim().replace(/\|/g, "\\|")
    );
    if (cells.length > 0) rows.push(cells);
  });
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => {
    const copy = [...row];
    while (copy.length < width) copy.push("");
    return copy;
  });
  const header = normalized[0];
  const divider = header.map(() => "---");
  const body = normalized.slice(1);
  return [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function blockElementToMarkdown(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (/^h([1-6])$/.test(tag)) {
    const level = Number(tag[1]);
    return `${"#".repeat(level)} ${getTextContent(el)}`;
  }
  if (tag === "p") {
    const children = [...el.children];
    const onlyBold =
      children.length === 1 &&
      (children[0].tagName === "STRONG" || children[0].tagName === "B") &&
      getTextContent(children[0]) === getTextContent(el);
    if (onlyBold) {
      return getTextContent(el);
    }
    return serializeInlineHtml(el);
  }
  if (tag === "blockquote") {
    return getTextContent(el)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (tag === "ul" || tag === "ol") {
    const ordered = tag === "ol";
    return [...el.querySelectorAll(":scope > li")]
      .map((li, index) => `${ordered ? `${index + 1}.` : "-"} ${getTextContent(li)}`)
      .join("\n");
  }
  if (tag === "table") return tableElementToMarkdown(el as HTMLTableElement);
  if (tag === "pre") return `\`\`\`\n${getTextContent(el)}\n\`\`\``;
  return serializeInlineHtml(el);
}

/** Recover markdown from CKEditor HTML (including single-paragraph blobs). */
export function htmlToManuscriptMarkdown(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ");
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) return html;

  const children = [...body.children];
  if (children.length === 0) return (body.textContent || "").trim();

  if (children.length === 1 && children[0].tagName.toLowerCase() === "p") {
    const paragraph = children[0];
    const hasRichInline = paragraph.querySelector("strong, b, em, i, code, a, sub, sup");
    if (!hasRichInline) {
      return joinInlineParts([(paragraph.textContent || "").replace(/\s+/g, " ")]);
    }
    const markdown = serializeInlineHtml(paragraph);
    return markdown || joinInlineParts([(paragraph.textContent || "").replace(/\s+/g, " ")]);
  }

  return children
    .map((el) => blockElementToMarkdown(el))
    .filter(Boolean)
    .join("\n\n");
}

/** Wrap LaTeX delimiters that are not already in $...$ / $$...$$. */
export function wrapLatexDelimiters(text: string): string {
  let source = text;
  source = source.replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => `\n\n$$${body.trim()}$$\n\n`);
  source = source.replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => `$${body.trim()}$`);
  source = source.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/gi, (match) => `\n\n$$${match}$$\n\n`);
  return source;
}

/** Insert breaks before headings, theorems, tables, and section numbers embedded in OCR text. */
export function normalizeManuscriptSource(text: string): string {
  let source = (text || "").replace(/\r\n/g, "\n").trim();
  if (!source) return "";

  source = source.replace(/\s+(#{1,6}\s+)/g, "\n\n$1");
  source = source.replace(/\s+(\d+\.\d+(?:\.\d+)?\s+[A-Z][^\n]{0,120})/g, "\n\n$1");
  source = source.replace(
    /\s+((?:Proposition|Theorem|Lemma|Corollary|Proof|Algorithm|Definition)\s+\d+[^\n]*)/gi,
    "\n\n$1"
  );
  source = source.replace(/\s+((?:Table|Figure)\s+\d+[.:][^\n]*)/gi, "\n\n$1");
  source = source.replace(/\n{3,}/g, "\n\n");

  return source.trim();
}

/** Wrap undelimited formula lines so KaTeX can render them. */
export function wrapRawLatexLines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || /\$/.test(trimmed)) return line;
      if (isMarkdownTableRow(trimmed) || isMarkdownTableSeparator(trimmed)) return line;
      if (/^#{1,6}\s/.test(trimmed)) return line;
      if (looksLikeExtractedStructuralLine(trimmed)) return line;
      if (!looksLikeFormulaLine(trimmed)) return line;
      if (trimmed.length > 80 || /\\begin|\\\\|\\frac|∫|∑/.test(trimmed)) {
        return `$$${trimmed}$$`;
      }
      return `$${trimmed}$`;
    })
    .join("\n");
}

function reflowExtractedBlock(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return lines[0] || "";

  const parts: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      parts.push(paragraph.join(" "));
      paragraph = [];
    }
  };

  for (const line of lines) {
    if (/^\d+\s+of\s+\d+$/i.test(line)) continue;
    if (
      /^#{1,6}\s/.test(line) ||
      isMarkdownTableRow(line) ||
      isMarkdownTableSeparator(line) ||
      looksLikeExtractedStructuralLine(line) ||
      looksLikeFormulaLine(line)
    ) {
      flushParagraph();
      parts.push(line);
      continue;
    }
    if (paragraph.length > 0 && paragraph[paragraph.length - 1].endsWith("-")) {
      paragraph[paragraph.length - 1] = paragraph[paragraph.length - 1].slice(0, -1) + line;
    } else {
      paragraph.push(line);
    }
  }

  flushParagraph();
  return parts.join("\n");
}

export function markdownishFromExtractedText(value: string): string {
  const normalized = normalizeManuscriptSource(wrapRawLatexLines(value));
  return normalized
    .split(/\n{2,}/)
    .map((block) => reflowExtractedBlock(block))
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").filter(Boolean);
      if (lines.every((line) => isMarkdownTableRow(line) || isMarkdownTableSeparator(line))) {
        return lines.join("\n");
      }
      return lines
        .map((line) => {
          const trimmed = line.trim();
          if (isMarkdownTableRow(trimmed) || isMarkdownTableSeparator(trimmed)) return trimmed;
          if (/^\s*(?:[-*+]|(?:\d+|[a-z])[\.\)])\s+/.test(line)) return line;
          if (/^#{1,6}\s+/.test(trimmed)) return trimmed;
          if (/^\d+\.\d+(?:\.\d+)?\s+[A-Z]/.test(trimmed)) return `### ${trimmed}`;
          if (
            /^\s*(?:abstract|summary|introduction|methods?|methodology|results?|findings?|discussion|conclusion|references?|bibliography)\b/i.test(
              trimmed
            )
          ) {
            return `### ${trimmed}`;
          }
          return line;
        })
        .join("\n\n");
    })
    .join("\n\n");
}

/** Drop markdown bold markers from body text (section headers stay styled via h2/h3). */
export function stripSpuriousBoldMarkdown(text: string): string {
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^#{1,6}\s/.test(trimmed)) return line;
      if (/^\*\*[\s\S]+\*\*$/.test(trimmed)) {
        return line.replace(/\*\*/g, "");
      }
      return line.replace(/\*\*([^*\n]+)\*\*/g, "$1");
    })
    .join("\n");
}

export function prepareManuscriptSource(raw: string): string {
  let text = (raw || "").trim();
  if (!text) return "";

  if (isManuscriptHtml(text)) {
    text = htmlToManuscriptMarkdown(text);
  }

  text = stripSpuriousBoldMarkdown(text);
  text = repairCollapsedWords(text);
  text = unwrapSpuriousMathDelimiters(text);
  text = wrapLatexDelimiters(text);
  text = normalizeManuscriptSource(wrapRawLatexLines(text));
  return markdownishFromExtractedText(text);
}
