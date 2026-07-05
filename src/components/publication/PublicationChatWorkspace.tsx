import { type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { fullAuthorLineFromPublication } from "../../lib/publicationAuthors";
import { publicationResearchInstitutionLabel } from "../../lib/publicationMapLocation";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { PublicationSummaryAssistant } from "./PublicationSummaryAssistant";
import type { Publication } from "../../types";

interface Props {
  publication: Publication;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function PublicationChatWorkspace({ publication, scrollContainerRef }: Props) {
  const authorLine = fullAuthorLineFromPublication(publication);
  const subVisual = publicationSubcategoryVisual(publication);
  const institutionLabel = publicationResearchInstitutionLabel(publication);
  const displayTitle = formatGrePaperTitle(publication.title, publication.short_number);
  const publicationPath = buildPublicationPath(publication.id, publication.encoded_id);

  return (
    <div className="publication-chat-workspace flex min-h-0 flex-1 flex-col bg-white sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">
      <header className="publication-chat-workspace__header shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
          <Link
            to="/"
            className="gre-interactive inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-brand-700"
            aria-label="Back to map"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <nav
            className="hidden min-w-0 flex-1 items-center gap-1 text-xs text-slate-500 sm:flex"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="truncate hover:text-brand-700">
              Map
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
            <Link to={publicationPath} className="truncate hover:text-brand-700">
              Paper
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
            <span className="truncate font-medium text-slate-700">Assistant</span>
          </nav>
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-500 sm:hidden">
            Research Assistant
          </p>
          <Link
            to={publicationPath}
            className="gre-interactive inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            <span className="hidden sm:inline">View paper</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          {subVisual ? (
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600">
              {subVisual.name}
            </p>
          ) : null}
          <h1 className="mt-0.5 text-base font-semibold leading-snug text-ink sm:text-lg">
            {displayTitle}
          </h1>
          {authorLine ? (
            <p className="mt-1 text-sm text-slate-600">{authorLine}</p>
          ) : null}
          {institutionLabel ? (
            <p className="mt-0.5 text-xs text-slate-500">{institutionLabel}</p>
          ) : null}
        </div>
      </header>

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
  );
}
