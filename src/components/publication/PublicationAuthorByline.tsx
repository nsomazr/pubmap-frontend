import { Link } from "react-router-dom";
import type { AuthorByline } from "../../lib/publicationAuthors";

interface Props {
  byline: AuthorByline;
  className?: string;
}

function AuthorSeparator({ index, total }: { index: number; total: number }) {
  if (index === 0) return null;
  if (index === total - 1) return <span className="font-normal text-slate-600"> and </span>;
  return <span className="font-normal text-slate-600">, </span>;
}

export function PublicationAuthorByline({ byline, className = "" }: Props) {
  if (!byline.authors.length) return null;

  const total = byline.authors.length;

  return (
    <div className={`publication-author-byline mt-3 border-b border-slate-200 pb-4 ${className}`}>
      <p className="font-serif text-[15px] font-bold leading-relaxed text-slate-900 sm:text-base">
        {byline.authors.map((author, index) => (
          <span key={`${author.name}-${index}`} className="inline">
            <AuthorSeparator index={index} total={total} />
            {author.profileUrl ? (
              <Link
                to={author.profileUrl}
                className="text-slate-900 transition hover:text-brand-700"
              >
                {author.name}
              </Link>
            ) : (
              <span>{author.name}</span>
            )}
            {author.affiliationIndices.length > 0 && (
              <sup className="ml-0.5 align-super text-[0.62em] font-normal leading-none text-slate-700">
                {author.affiliationIndices.join(",")}
              </sup>
            )}
          </span>
        ))}
      </p>

      {byline.affiliations.length > 0 && (
        <div className="mt-2.5 space-y-1 font-serif text-sm leading-snug text-slate-600">
          {byline.affiliations.map((aff) => (
            <p key={aff.index} className="m-0 pl-[1.35rem] indent-[-1.35rem]">
              <sup className="mr-1 align-super text-[0.62em] font-normal leading-none text-slate-700">
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
