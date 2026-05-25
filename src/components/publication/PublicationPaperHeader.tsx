import { formatGrePaperTitle, grePaperCode } from "../../lib/grePaperTitle";
import { assets } from "../../lib/brand";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { AuthorByline } from "../../lib/publicationAuthors";
import { PublicationAuthorByline } from "./PublicationAuthorByline";
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
  teamSize?: number;
  greDoi?: string | null;
  accessType?: "open" | "closed";
  draft?: boolean;
}

function GreBrandBlock({
  draft,
  accessType,
}: Pick<PublicationPaperHeaderProps, "draft" | "accessType">) {
  return (
    <div className="mr-2 flex shrink-0 flex-col items-center gap-2 sm:mr-3">
      <img
        src={assets.logo}
        alt="Global Research Exchange"
        className="h-16 w-16 shrink-0 object-contain"
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
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
  );
}

function PlatformNameBadge() {
  return (
    <div className="flex w-full flex-col items-center bg-slate-400 px-6 py-3 text-center text-white shadow-sm sm:px-8 sm:py-3.5">
      <span className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em] sm:text-[15px]">
        Global Research Exchange
      </span>
      <span className="mt-2 whitespace-nowrap text-[10px] font-medium tracking-[0.03em] text-slate-50 sm:text-[11px]">
        Sharing research, connecting experts, advancing discovery.
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
    <aside className="publication-paper-category shrink-0 pt-1" aria-label={label}>
      <div className="flex items-center justify-center">
        {visual ? (
          <SubcategoryVisual
            visual={visual}
            size="lg"
            fit="contain"
            clip={false}
            shadow={false}
            className="!h-20 !w-20 !rounded-none"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center border border-slate-200 bg-white text-xl font-bold text-slate-600">
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
  teamSize,
  greDoi,
  greNumber,
  accessType,
}: Pick<
  PublicationPaperHeaderProps,
  | "publishedLabel"
  | "location"
  | "funder"
  | "viewsCount"
  | "downloadsCount"
  | "discussionsCount"
  | "responsesCount"
  | "teamSize"
  | "greDoi"
  | "greNumber"
  | "accessType"
>) {
  const rows: { label: string; value: string; secondaryValue?: string }[] = [];
  const paperCode = grePaperCode(greNumber);

  if (publishedLabel) {
    rows.push({ label: "Published on", value: publishedLabel });
  }
  if (location) {
    rows.push({ label: "Study location", value: location });
  }
  if (funder?.trim()) {
    rows.push({ label: "Funder", value: funder.trim() });
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
    rows.push({
      label: "GRE DOI",
      value: greDoi.trim().toUpperCase(),
      secondaryValue: paperCode ? `Paper number: ${paperCode}` : undefined,
    });
  } else if (paperCode) {
    rows.push({ label: "Paper number", value: paperCode });
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
    funder,
    viewsCount,
    downloadsCount,
    discussionsCount,
    responsesCount,
    teamSize,
    greDoi,
    greNumber,
    accessType,
  });
  const leftMetaRows = metaRows.filter((_, index) => index % 2 === 0);
  const rightMetaRows = metaRows.filter((_, index) => index % 2 === 1);

  return (
    <header className="publication-paper-header overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start gap-2 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
        <GreBrandBlock draft={draft} accessType={accessType} />
        <div className="flex min-w-0 flex-1 items-center pt-1">
          <PlatformNameBadge />
        </div>
        <CategoryTopBadge visual={subVisual} name={subCategoryName || subVisual?.name} />
      </div>

      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <h1 className="text-xl font-bold leading-snug text-ink sm:text-2xl lg:text-[1.65rem] lg:leading-tight">
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
          <div className="publication-paper-meta inline-flex max-w-full flex-col gap-y-1.5 sm:flex-row sm:gap-x-4">
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
    </header>
  );
}
