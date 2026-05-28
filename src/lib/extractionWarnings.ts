/** Drop internal extraction/OCR status noise; keep only actionable notes for authors. */
const NOISE_PATTERNS = [
  /^GRE used the standard section extraction/i,
  /^GRE used retrieval-assisted extraction/i,
  /^GRE used automatic OCR/i,
  /^Unknown OCR_BACKEND/i,
  /^Unknown requested OCR backend/i,
  /^Enhanced OCR was unavailable/i,
  /^Preferred OCR backends were unavailable/i,
  /^GRE retried extraction/i,
];

export function sanitizeExtractionWarnings(warnings: string[] | undefined | null): string[] {
  return [...new Set((warnings ?? []).map((w) => w.trim()).filter(Boolean))].filter(
    (warning) => !NOISE_PATTERNS.some((pattern) => pattern.test(warning))
  );
}
