export type EvidenceFileKind = "image" | "pdf" | "other";

export function evidenceFileKind(url: string): EvidenceFileKind {
  const path = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(path)) return "image";
  if (path.endsWith(".pdf")) return "pdf";
  return "other";
}

export function formatClaimDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
