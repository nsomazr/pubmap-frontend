/** Helpers to turn extracted plain text into markdown-friendly source. */

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
    /\\(?:frac|begin|end|left|right|text|mathrm|mathbf|mathit|sqrt|sum|prod|int|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|phi|psi|omega|hat|bar|vec|dot|ddot|label|ref|cite)\b/.test(
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
    if (looksLikeExtractedStructuralLine(line) || looksLikeFormulaLine(line)) {
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
  return value
    .split(/\n{2,}/)
    .map((block) => reflowExtractedBlock(block))
    .filter(Boolean)
    .map((block) =>
      block
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          if (/^\s*(?:[-*+]|(?:\d+|[a-z])[\.\)])\s+/.test(line)) return line;
          const trimmed = line.trim();
          if (/^#{1,6}\s+/.test(trimmed)) return trimmed;
          if (
            /^\s*(?:abstract|summary|introduction|methods?|methodology|results?|findings?|discussion|conclusion|references?|bibliography)\b/i.test(
              trimmed
            )
          ) {
            return `### ${trimmed}`;
          }
          return line;
        })
        .join("\n\n")
    )
    .join("\n\n");
}

export function isManuscriptHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}
