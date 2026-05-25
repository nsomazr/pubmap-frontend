import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { assets } from "../../lib/brand";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { AuthorByline } from "../../lib/publicationAuthors";
import { PublicationAuthorByline } from "./PublicationAuthorByline";
import type { SubcategoryVisual as Visual } from "../../types";

export interface PublicationPaperHeaderProps {
  title: string;
  greNumber?: string | null;
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
  teamSize?: number;
  greDoi?: string | null;
  accessType?: "open" | "closed";
  draft?: boolean;
}

function CategoryTopBadge({
  visual,
  name,
}: {
  visual?: Visual | null;
  name?: string;
}) {
  if (!visual && !name) return null;
  const accent = visual?.accent_color ?? "#3b5bdb";
  const label = name || visual?.name || "Research area";

  return (
    <aside
      className="publication-paper-category shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md ring-1 ring-slate-100"
      aria-label={label}
    >
      <div
        className="flex min-w-[7.5rem] flex-col items-center px-3 pb-2.5 pt-3 sm:min-w-[8.5rem]"
        style={{ background: `linear-gradient(165deg, ${accent} 0%, ${accent}dd 100%)` }}
      >
        {visual ? (
          <SubcategoryVisual
            visual={visual}
            size="lg"
            className="!h-14 !w-14 !rounded-xl ring-2 ring-white/90"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white">
            {label.slice(0, 2).toUpperCase()}
          </span>
        )}
        <p className="mt-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-white sm:text-[11px]">
          {label}
        </p>
      </div>
    </aside>
  );
}

function buildMetaRows({
  publishedLabel,
  location,
  viewsCount,
  downloadsCount,
  discussionsCount,
  responsesCount,
  teamSize,
  greDoi,
  accessType,
}: Pick<
  PublicationPaperHeaderProps,
  | "publishedLabel"
  | "location"
  | "viewsCount"
  | "downloadsCount"
  | "discussionsCount"
  | "responsesCount"
  | "teamSize"
  | "greDoi"
  | "accessType"
>) {
  const rows: { label: string; value: string }[] = [];

  if (publishedLabel) {
    rows.push({ label: "Published on", value: publishedLabel });
  }
  if (location) {
    rows.push({ label: "Study location", value: location });
  }
  rows.push({
    label: "Readers",
    value: `${viewsCount ?? 0} views · ${downloadsCount ?? 0} downloads`,
  });
  rows.push({ label: "Discussions", value: String(discussionsCount ?? 0) });
  if (typeof responsesCount === "number" || typeof teamSize === "number") {
    const replies = responsesCount ?? 0;
    const authors = teamSize ?? 1;
    rows.push({
      label: "Responses",
      value: `${replies} replies · ${authors} author${authors === 1 ? "" : "s"}`,
    });
  }
  if (accessType) {
    rows.push({
      label: "Access",
      value: accessType === "closed" ? "Restricted access" : "Open access",
    });
  }
  if (greDoi?.trim()) {
    rows.push({ label: "GRE DOI", value: greDoi.trim().toUpperCase() });
  }

  return rows;
}

export function PublicationPaperHeader({
  title,
  greNumber,
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
  responsesCount,
  teamSize,
  greDoi,
  accessType,
  draft,
}: PublicationPaperHeaderProps) {
  const displayTitle = formatGrePaperTitle(title, greNumber);
  const metaRows = buildMetaRows({
    publishedLabel,
    location,
    viewsCount,
    downloadsCount,
    discussionsCount,
    responsesCount,
    teamSize,
    greDoi,
    accessType,
  });

  return (
    <header className="publication-paper-header overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={assets.logo}
            alt="Global Research Exchange"
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
              Global Research Exchange
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {draft && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Draft preview
                </span>
              )}
              {accessType === "closed" && (
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Restricted
                </span>
              )}
            </div>
          </div>
        </div>

        <CategoryTopBadge visual={subVisual} name={subCategoryName || subVisual?.name} />
      </div>

      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <h1 className="text-justify text-xl font-bold leading-snug text-ink hyphens-auto sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
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
          <dl className="publication-paper-meta grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {metaRows.map((row) => (
              <div key={row.label} className="flex min-w-0 items-start gap-2 text-xs sm:text-sm">
                <dt className="w-[7.25rem] shrink-0 font-medium text-slate-500">{row.label}</dt>
                <dd className="min-w-0 font-semibold text-slate-700">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </header>
  );
}
