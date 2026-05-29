import { metaCountValue } from "../../lib/formatMetaCount";
import { formatGrePaperTitle, grePaperCode } from "../../lib/grePaperTitle";
import { assets } from "../../lib/brand";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { AuthorByline } from "../../lib/publicationAuthors";
import { PublicationAuthorByline } from "./PublicationAuthorByline";
import { ManuscriptContent } from "./ManuscriptContent";
import type { SubcategoryVisual as Visual } from "../../types";

export interface PublicationPaperHeaderProps {
  title: string;
  greNumber?: string | null;
  funder?: string;
  authorName?: string;
  affiliation?: string;
  authorByline?: AuthorByline;
  subVisual?: Visual | null;
  subCategoryName?: string;
  publishedLabel?: string;
  location?: string;
  viewsCount?: number;
  downloadsCount?: number;
  discussionsCount?: number;
  responsesCount?: number;
  greDoi?: string | null;
  accessType?: "open" | "closed";
  authorsComment?: string | null;
  draft?: boolean;
}

function GreBrandBlock({ draft }: Pick<PublicationPaperHeaderProps, "draft">) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-center sm:gap-2">
      <img
        src={assets.logo}
        alt="Global Research Exchange"
        className="h-10 w-10 shrink-0 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
      />
      {draft && (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Draft preview
        </span>
      )}
    </div>
  );
}

function PlatformNameBadge() {
  return (
    <div className="flex min-w-0 w-full flex-col items-center bg-slate-400 px-2 py-2 text-center text-white shadow-sm sm:px-8 sm:py-3.5">
      <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.1em] sm:text-[15px] sm:tracking-[0.14em]">
        Global Research Exchange
      </span>
      <span className="mt-1.5 hidden min-[400px]:grid w-full grid-cols-[minmax(1.75rem,1fr)_auto_minmax(1.75rem,1fr)] items-center gap-2 text-[9px] font-medium leading-tight tracking-[0.02em] text-slate-50 sm:mt-2 sm:gap-3 sm:text-[11px] sm:tracking-[0.03em]">
        <span className="block h-px w-full bg-white/80" />
        <span className="text-center">sharing research, connecting experts, advancing discovery</span>
        <span className="block h-px w-full bg-white/80" />
      </span>
    </div>
  );
}

function CategoryTopBadge({
  visual,
  name,
}: {
  visual?: Visual | null;
  name?: string;
}) {
  if (!visual && !name) return null;
  const label = name || visual?.name || "Research area";

  return (
    <aside className="publication-paper-category shrink-0" aria-label={label}>
      <div className="flex items-center justify-end">
        {visual ? (
          <SubcategoryVisual
            visual={visual}
            size="lg"
            fit="contain"
            clip={false}
            shadow={false}
            className="!h-10 !w-10 !rounded-none sm:!h-[5.25rem] sm:!w-[5.25rem]"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-xs font-bold text-slate-600 sm:h-20 sm:w-20 sm:text-xl">
            {label.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </aside>
  );
}

function buildMetaRows({
  publishedLabel,
  location,
  funder,
  viewsCount,
  downloadsCount,
  discussionsCount,
  responsesCount,
  greDoi,
  greNumber,
}: Pick<
  PublicationPaperHeaderProps,
  | "publishedLabel"
  | "location"
  | "funder"
  | "viewsCount"
  | "downloadsCount"
  | "discussionsCount"
  | "responsesCount"
  | "greDoi"
  | "greNumber"
>) {
  const rows: { label: string; value: string; secondaryValue?: string }[] = [];
  const paperCode = grePaperCode(greNumber);

  if (paperCode) {
    rows.push({ label: "Paper ID", value: paperCode });
  }
  if (publishedLabel) {
    rows.push({ label: "Published On:", value: publishedLabel });
  }
  if (location) {
    rows.push({ label: "Area", value: location });
  }
  if (funder?.trim()) {
    rows.push({ label: "Funder", value: funder.trim() });
  }
  rows.push({ label: "Views", value: metaCountValue(viewsCount) });
  rows.push({ label: "Downloads", value: metaCountValue(downloadsCount) });
  rows.push({ label: "Discussions", value: metaCountValue(discussionsCount) });
  rows.push({ label: "Responses", value: metaCountValue(responsesCount) });
  if (greDoi?.trim()) {
    rows.push({
      label: "DOI",
      value: greDoi.trim().toUpperCase(),
      secondaryValue: undefined,
    });
  }

  return rows;
}

export function PublicationPaperHeader({
  title,
  greNumber,
  funder,
  authorName,
  affiliation,
  authorByline,
  subVisual,
  subCategoryName,
  publishedLabel,
  location,
  viewsCount = 0,
  downloadsCount = 0,
  discussionsCount = 0,
  responsesCount = 0,
  greDoi,
  authorsComment,
  draft,
}: PublicationPaperHeaderProps) {
  const displayTitle = formatGrePaperTitle(title, greNumber);
  const metaRows = buildMetaRows({
    publishedLabel,
    location,
    funder,
    viewsCount,
    downloadsCount,
    discussionsCount,
    responsesCount,
    greDoi,
    greNumber,
  });
  const leftMetaRows = metaRows.filter((_, index) => index % 2 === 0);
  const rightMetaRows = metaRows.filter((_, index) => index % 2 === 1);

  return (
    <header className="publication-paper-header overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 border-b border-slate-100 bg-white px-2 py-2.5 sm:grid-cols-[6.5rem_minmax(0,1fr)_6.5rem] sm:gap-3 sm:px-7 sm:py-4">
        <GreBrandBlock draft={draft} />
        <div className="min-w-0 justify-self-stretch">
          <PlatformNameBadge />
        </div>
        <CategoryTopBadge visual={subVisual} name={subCategoryName || subVisual?.name} />
      </div>

      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <h1 className="text-lg font-bold leading-snug text-ink sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
          {displayTitle}
        </h1>
        {authorByline && authorByline.authors.length > 0 ? (
          <PublicationAuthorByline byline={authorByline} />
        ) : (
          <>
            {authorName && (
              <p className="mt-2.5 text-base font-semibold text-slate-800">{authorName}</p>
            )}
            {affiliation && <p className="mt-0.5 text-sm text-slate-600">{affiliation}</p>}
          </>
        )}
      </div>

      {metaRows.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-7">
          <div className="publication-paper-meta grid max-w-full gap-3 md:grid-cols-2 md:gap-x-4">
            <dl className="space-y-1.5">
              {leftMetaRows.map((row) => (
                <div key={row.label} className="flex min-w-0 items-start gap-2 text-xs sm:text-sm">
                  <dt className="w-[4.75rem] shrink-0 font-medium text-slate-500">{row.label}</dt>
                  <dd className="min-w-0 font-semibold text-slate-700">
                    <span className="block">{row.value}</span>
                    {row.secondaryValue && (
                      <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-slate-400 sm:text-[11px]">
                        {row.secondaryValue}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-1.5">
              {rightMetaRows.map((row) => (
                <div key={row.label} className="flex min-w-0 items-start gap-2 text-xs sm:text-sm">
                  <dt className="w-[4.75rem] shrink-0 font-medium text-slate-500">{row.label}</dt>
                  <dd className="min-w-0 font-semibold text-slate-700">
                    <span className="block">{row.value}</span>
                    {row.secondaryValue && (
                      <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-slate-400 sm:text-[11px]">
                        {row.secondaryValue}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {authorsComment?.trim() && (
        <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Author&apos;s Comment
          </h2>
          <ManuscriptContent
            value={authorsComment.trim()}
            className="mt-3 min-w-0 text-sm leading-relaxed text-slate-700"
          />
        </div>
      )}
    </header>
  );
}
