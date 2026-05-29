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
        <header className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 items-center gap-2.5">
                <UserAvatar
                  user={pub.author}
                  size="md"
                  className="!h-11 !w-11 !rounded-xl !text-xs sm:!h-12 sm:!w-12 sm:!text-sm"
                />
                {subVisual && (
                  <SubcategoryVisual
                    visual={subVisual}
                    size="sm"
                    fit="contain"
                    clip={false}
                    shadow={false}
                    className="!h-10 !w-10 shrink-0 sm:!h-11 sm:!w-11"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {subVisual && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                    {subVisual.name}
                  </p>
                )}
                <h1 className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-ink sm:text-lg">
                  {crumbTitle}
                </h1>
                {author && <p className="mt-0.5 text-sm text-slate-600">{author}</p>}
                {institutionLabel && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                    <span className="line-clamp-2">{institutionLabel}</span>
                  </p>
                )}
              </div>
            </div>
            <Link
              to={buildPublicationPath(pub.id, pub.encoded_id)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 sm:ml-2"
            >
              <ExternalLink className="h-4 w-4" />
              Full publication
            </Link>
          </div>
        </header>

        <div className="publication-chat-page__body flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4">
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
