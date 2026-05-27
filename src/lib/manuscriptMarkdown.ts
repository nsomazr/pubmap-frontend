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

export function looksLikeFormulaLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  if (/(?<!\\)\$.*?(?<!\\)\$/.test(value)) return true;
  if (
    /\\(?:frac|begin|end|left|right|text|mathrm|mathbf|mathit|sqrt|sum|prod|int|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|phi|psi|omega|hat|bar|vec|dot|ddot|label|ref|cite|pmb|mathbb)\b/.test(
      value
    )
  ) {
    return true;
  }
  if (/[=<>≈≠±×÷∑∏√∂∫μσλπϕθ]/.test(value)) return true;
  if (/\b(?:softmax|max|min|argmax|argmin|Q\(|O\(|f\(x\)|g\(x\)|sin\(|cos\(|tan\(|log\(|exp\()/i.test(value)) {
    return true;
  }
  const operatorCount = (value.match(/[=+\-/*^<>()[\]{}]/g) || []).length;
  const digitCount = (value.match(/\d/g) || []).length;
  return operatorCount >= 3 && digitCount >= 1;
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
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
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
  if (tag === "p") return serializeInlineHtml(el);
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
    const markdown = serializeInlineHtml(children[0]);
    return markdown || (body.textContent || "").trim();
  }

  return children
    .map((el) => blockElementToMarkdown(el))
    .filter(Boolean)
    .join("\n\n");
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

export function prepareManuscriptSource(raw: string): string {
  let text = (raw || "").trim();
  if (!text) return "";

  if (isManuscriptHtml(text) && !hasStructuredHtmlBlocks(text)) {
    text = htmlToManuscriptMarkdown(text);
  } else if (isManuscriptHtml(text)) {
    return text;
  }

  return markdownishFromExtractedText(text);
}
