import { Link } from "react-router-dom";
import type { AuthorByline } from "../../lib/publicationAuthors";

interface Props {
  byline: AuthorByline;
  className?: string;
}

export function PublicationAuthorByline({ byline, className = "" }: Props) {
  if (!byline.authors.length) return null;

  return (
    <div className={`publication-author-byline mt-3 ${className}`}>
      <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-base leading-relaxed text-slate-800">
        {byline.authors.map((author, index) => (
          <span key={`${author.name}-${index}`} className="inline-flex items-baseline">
            {index > 0 && (
              <span className="px-1.5 font-normal text-slate-400" aria-hidden>
                ·
              </span>
            )}
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
              <sup className="ml-0.5 align-super text-[10px] font-semibold leading-none text-brand-700">
                {author.affiliationIndices.join(",")}
              </sup>
            )}
          </span>
        ))}
      </p>

      {byline.affiliations.length > 0 && (
        <div className="mt-2.5 space-y-1 text-sm leading-snug text-slate-600">
          {byline.affiliations.map((aff) => (
            <p key={aff.index} className="m-0">
              <sup className="mr-1.5 align-super text-[10px] font-semibold leading-none text-brand-700">
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
