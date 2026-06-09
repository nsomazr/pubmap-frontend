import type { Publication } from "../../types";
import { compactAuthorLineFromPublication } from "../../lib/publicationAuthors";

interface Props {
  publication: Publication;
  maxAuthors?: number;
  className?: string;
}

export function PublicationAuthorLine({
  publication,
  maxAuthors = 3,
  className = "",
}: Props) {
  const line = compactAuthorLineFromPublication(publication, maxAuthors);
  if (!line) return null;
  return <p className={`truncate text-xs text-slate-500 ${className}`.trim()}>{line}</p>;
}
