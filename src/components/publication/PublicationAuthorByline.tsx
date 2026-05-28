import { Link } from "react-router-dom";
import type { AuthorByline } from "../../lib/publicationAuthors";

interface Props {
  byline: AuthorByline;
  className?: string;
}

export function PublicationAuthorByline({ byline, className = "" }: Props) {
  if (!byline.authors.length) return null;

  return (
    <div className={`publication-author-byline mt-3 font-serif ${className}`}>
      <p className="text-base leading-relaxed text-slate-800">
        {byline.authors.map((author, index) => (
          <span key={`${author.name}-${index}`} className="inline">
            {index > 0 && <span className="text-slate-600">, </span>}
            {author.profileUrl ? (
              <Link
                to={author.profileUrl}
                className="font-semibold text-ink transition hover:text-brand-700"
              >
                {author.name}
              </Link>
            ) : (
              <span className="font-semibold text-ink">{author.name}</span>
            )}
            {author.affiliationIndices.length > 0 && (
              <sup className="ml-px align-super text-[0.65em] font-normal leading-none text-slate-600">
                {author.affiliationIndices.join(",")}
              </sup>
            )}
          </span>
        ))}
      </p>

      {byline.affiliations.length > 0 && (
        <div className="mt-3 space-y-1 pl-10 text-sm leading-snug text-slate-600 sm:pl-14">
          {byline.affiliations.map((aff) => (
            <p key={aff.index} className="m-0">
              <sup className="mr-1 align-super text-[0.65em] font-normal leading-none text-slate-600">
                {aff.index}
              </sup>
              <span>{aff.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
