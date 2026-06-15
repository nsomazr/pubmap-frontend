import type { Publication } from "../../types";
import { compactAuthorLineFromPublication } from "../../lib/publicationAuthors";

interface Props {
  publication: Publication;
  /** When set, truncates with "et al."; omit to list every author. */
  maxAuthors?: number;
  className?: string;
}

export function PublicationAuthorLine({
  publication,
  maxAuthors,
  className = "",
}: Props) {
  const line = compactAuthorLineFromPublication(publication, maxAuthors);
  if (!line) return null;
  return (
    <p className={`text-xs leading-snug text-slate-500 ${className}`.trim()}>{line}</p>
  );
}
