import { useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { fullAuthorLineFromPublication } from "../../lib/publicationAuthors";
import { publicationResearchInstitutionLabel } from "../../lib/publicationMapLocation";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { PublicationSummaryAssistant } from "./PublicationSummaryAssistant";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import { UserAvatar } from "../ui/UserAvatar";
import type { Publication } from "../../types";

interface Props {
  publication: Publication;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function PublicationChatWorkspace({ publication, scrollContainerRef }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const authorLine = fullAuthorLineFromPublication(publication);
  const subVisual = publicationSubcategoryVisual(publication);
  const institutionLabel = publicationResearchInstitutionLabel(publication);
  const displayTitle = formatGrePaperTitle(publication.title, publication.short_number);
  const publicationPath = buildPublicationPath(publication.id, publication.encoded_id);

  return (
    <div className="publication-chat-workspace flex min-h-0 flex-1 flex-col">
      <header className="publication-chat-workspace__toolbar shrink-0 border-b border-slate-200/90 bg-white px-3 py-2 sm:hidden">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:text-brand-700"
            aria-label="Back to map"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
              GRE Assistant
            </p>
            <p className="truncate text-sm font-semibold text-ink">{displayTitle}</p>
          </div>
          <Link
            to={publicationPath}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            aria-label="Full publication"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="publication-chat-page gre-public-card flex min-h-0 flex-1 flex-col overflow-hidden sm:rounded-2xl">
        <header className="shrink-0 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left sm:hidden"
            aria-expanded={detailsOpen}
          >
            <UserAvatar
              user={publication.author}
              size="md"
              className="!h-8 !w-8 shrink-0 !rounded-lg !text-[10px]"
            />
            {subVisual && (
              <SubcategoryVisual
                visual={subVisual}
                size="sm"
                fit="contain"
                clip={false}
                shadow={false}
                className="!h-8 !w-8 shrink-0"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-semibold text-ink">{displayTitle}</span>
              {authorLine && (
                <span className="line-clamp-2 text-xs leading-snug text-slate-500">{authorLine}</span>
              )}
            </span>
            {detailsOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>

          {detailsOpen && (
            <div className="border-t border-slate-100 px-3 pb-3 sm:hidden">
              {subVisual && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  {subVisual.name}
                </p>
              )}
              {institutionLabel && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>{institutionLabel}</span>
                </p>
              )}
              <Link
                to={publicationPath}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700"
              >
                View full publication
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          <div className="hidden items-center gap-3 px-4 py-3 sm:flex sm:px-5">
            <UserAvatar
              user={publication.author}
              size="md"
              className="!h-11 !w-11 shrink-0 !rounded-xl"
            />
            {subVisual && (
              <SubcategoryVisual
                visual={subVisual}
                size="sm"
                fit="contain"
                clip={false}
                shadow={false}
                className="!h-10 !w-10 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              {subVisual && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  {subVisual.name}
                </p>
              )}
              <h2 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
                {displayTitle}
              </h2>
              {authorLine && (
                <p className="mt-0.5 text-sm leading-snug text-slate-600">{authorLine}</p>
              )}
              {institutionLabel && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span className="line-clamp-1">{institutionLabel}</span>
                </p>
              )}
            </div>
            <Link
              to={publicationPath}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            >
              <ExternalLink className="h-4 w-4" />
              Full publication
            </Link>
          </div>
        </header>

        <div className="publication-chat-page__body min-h-0 flex-1 px-0 sm:px-1 sm:py-1">
          <PublicationSummaryAssistant
            publicationId={publication.id}
            publication={publication}
            autoGenerate
            layout="page"
            scrollContainerRef={scrollContainerRef}
            className="min-h-0 flex-1"
            composerVariant="workspace"
          />
        </div>
      </div>
    </div>
  );
}
