/** Plain text from abstract (HTML or plain). */
export function abstractPlainText(value?: string | null): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return stripMarkdownDecorations(trimmed);
  }
  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const text = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  return stripMarkdownDecorations(text);
}

function stripMarkdownDecorations(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\$\$([\s\S]+?)\$\$/g, " ")
    .replace(/(?<!\\)\$(?!\$)([^\n$]+?)(?<!\\)\$/g, " ")
    .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short plain-text snippet for publication cards and listings. */
export function abstractListingSnippet(value?: string | null, maxLength = 220): string {
  const plain = abstractPlainText(value);
  if (!plain) return "";
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trim()}…`;
}
