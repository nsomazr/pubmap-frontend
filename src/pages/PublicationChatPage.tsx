import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, ExternalLink } from "lucide-react";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import api from "../lib/api";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicationSummaryAssistant } from "../components/publication/PublicationSummaryAssistant";
import { UserAvatar } from "../components/ui/UserAvatar";
import { publicationSubcategoryVisual } from "../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../components/taxonomy/SubcategoryVisual";
import { publicationResearchInstitutionLabel } from "../lib/publicationMapLocation";
import { buildPublicationPath, publicationPublicApiPath } from "../lib/publicationPaths";
import type { Publication } from "../types";

export function PublicationChatPage() {
  const { id } = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(publicationPublicApiPath(id!));
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PublicPageLayout
        compactHero
        fillViewport
        accent="blue"
        title="Research assistant"
        crumbs={[{ label: "Home", to: "/" }, { label: "Loading…" }]}
        back={{ to: "/", label: "Back to map" }}
      >
        <p className="text-slate-500">Loading study…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !pub) {
    return (
      <PublicPageLayout
        compactHero
        fillViewport
        accent="blue"
        title="Research assistant"
        crumbs={[{ label: "Home", to: "/" }, { label: "Not found" }]}
        back={{ to: "/", label: "Back to map" }}
      >
        <p className="text-slate-600">Publication not found or not yet published.</p>
      </PublicPageLayout>
    );
  }

  const author =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const subVisual = publicationSubcategoryVisual(pub);
  const institutionLabel = publicationResearchInstitutionLabel(pub);
  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <PublicPageLayout
      compactHero
      fillViewport
      denseMobileHero
      accent="blue"
      badge="GRE Assistant"
      title="Research assistant"
      subtitle="Summaries and chat use this paper's uploaded manuscript (when available), GRE registry metadata, and structured sections for this study only."
      crumbs={[
        { label: "Home", to: "/" },
        {
          label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""),
          to: buildPublicationPath(pub.id, pub.encoded_id),
        },
        { label: "Manuscript chat" },
      ]}
      back={{ to: "/", label: "Back to map" }}
    >
      <div className="publication-chat-page gre-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="publication-chat-page__header--compact shrink-0 border-b border-slate-100 bg-slate-50/60 px-3 sm:px-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <UserAvatar
              user={pub.author}
              size="md"
              className="!h-9 !w-9 shrink-0 !rounded-xl !text-[10px] sm:!h-11 sm:!w-11 sm:!text-xs"
            />
            {subVisual && (
              <SubcategoryVisual
                visual={subVisual}
                size="sm"
                fit="contain"
                clip={false}
                shadow={false}
                className="!h-9 !w-9 shrink-0 sm:!h-10 sm:!w-10"
              />
            )}
            <div className="min-w-0 flex-1">
              {subVisual && (
                <p className="hidden text-[10px] font-bold uppercase tracking-wide text-brand-700 sm:block">
                  {subVisual.name}
                </p>
              )}
              <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ink sm:text-base">
                {crumbTitle}
              </h2>
              {author && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 sm:text-sm">{author}</p>
              )}
              {institutionLabel && (
                <p className="mt-0.5 hidden items-center gap-1 text-xs text-slate-500 sm:flex">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span className="line-clamp-1">{institutionLabel}</span>
                </p>
              )}
            </div>
            <Link
              to={buildPublicationPath(pub.id, pub.encoded_id)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 sm:gap-2 sm:px-3 sm:py-2"
              aria-label="Full publication"
              title="Full publication"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Full publication</span>
            </Link>
          </div>
        </header>

        <div className="publication-chat-page__body min-h-0 flex-1 px-3 py-2 sm:px-5 sm:py-3">
          <PublicationSummaryAssistant
            publicationId={pub.id}
            publication={pub}
            autoGenerate
            layout="page"
            scrollContainerRef={scrollRef}
            className="min-h-0 flex-1"
          />
        </div>
      </div>
    </PublicPageLayout>
  );
}
