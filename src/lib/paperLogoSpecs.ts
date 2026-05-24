export const PAPER_LOGO_SPECS = {
  title: "Paper logo specifications",
  summary: "Square logo for publication headers and GRE PDFs.",
  formats: "PNG, JPG, WEBP, SVG, or GIF",
  maxSize: "2 MB",
  recommendedSize: "256 × 256 px (minimum 128 × 128 px)",
  aspectRatio: "1:1 square",
} as const;

export const PAPER_LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

export function paperLogoSpecsText(): string {
  return `${PAPER_LOGO_SPECS.recommendedSize} · ${PAPER_LOGO_SPECS.formats} · max ${PAPER_LOGO_SPECS.maxSize}`;
}
