import { stripLatexForPlainText } from "./plainTitle";

/** Normalize stored short_number (e.g. "001") to GRE code "GRE-001". */
export function grePaperCode(shortNumber?: string | null): string | null {
  const raw = shortNumber?.trim();
  if (!raw) return null;
  if (/^GRE-/i.test(raw)) {
    return `GRE-${raw.replace(/^GRE-/i, "")}`;
  }
  return `GRE-${raw}`;
}

/** Strip an existing #GRE-XXX prefix from a stored title. */
export function stripGrePaperPrefix(title: string): string {
  const raw = (title || "").trim();
  const withoutGrePrefix = raw.replace(/^#?GRE-[\w-]+\s*:\s*/i, "").trim();
  const withoutMarkdownHeading = withoutGrePrefix.replace(/^#{1,6}\s+/, "").trim();
  return stripLatexForPlainText(withoutMarkdownHeading);
}

/** Reader-facing title: stored title without GRE number prefix. */
export function formatGrePaperTitle(
  title: string,
  shortNumber?: string | null,
  options?: { fallback?: string }
): string {
  const base =
    stripGrePaperPrefix(title) || options?.fallback?.trim() || "Untitled publication";
  void shortNumber;
  return base;
}
