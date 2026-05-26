import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import api from "../lib/api";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicationSummaryAssistant } from "../components/publication/PublicationSummaryAssistant";
import { UserAvatar } from "../components/ui/UserAvatar";
import { publicationSubcategoryVisual } from "../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../components/taxonomy/SubcategoryVisual";
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
        wide
        compactHero
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
        wide
        compactHero
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
  const locationLabel = [pub.coordinates?.location, pub.coordinates?.institution]
    .filter(Boolean)
    .join(" · ");
  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <PublicPageLayout
      wide
      compactHero
      accent="blue"
      badge="GRE Assistant"
      title="Research assistant"
      subtitle="Read an AI summary and ask follow-up questions about this study."
      crumbs={[
        { label: "Home", to: "/" },
        {
          label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""),
          to: buildPublicationPath(pub.id, pub.encoded_id),
        },
        { label: "Chat" },
      ]}
      back={{ to: "/", label: "Back to map" }}
    >
      <div className="publication-chat-page gre-card flex min-h-[min(72dvh,760px)] flex-col overflow-hidden">
        <header className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <UserAvatar
                user={pub.author}
                size="md"
                className="!h-11 !w-11 shrink-0 !border-2 !text-xs sm:!h-12 sm:!w-12 sm:!text-sm"
              />
              <div className="min-w-0 flex-1">
                {subVisual && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SubcategoryVisual visual={subVisual} size="sm" />
                    <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                      {subVisual.name}
                    </span>
                  </div>
                )}
                <h1 className="text-base font-semibold leading-snug text-ink sm:text-lg lg:text-xl">
                  {crumbTitle}
                </h1>
                {author && <p className="mt-1 text-sm text-slate-600">{author}</p>}
                {locationLabel && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 sm:text-sm">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 sm:h-4 sm:w-4" />
                    <span>{locationLabel}</span>
                  </p>
                )}
              </div>
            </div>
            <Link
              to={buildPublicationPath(pub.id, pub.encoded_id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 sm:ml-auto sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Full publication
            </Link>
          </div>
        </header>

        <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-6">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            GRE Assistant summarizes this study and answers follow-up questions about methods,
            findings, authors, or location.
          </p>
        </div>

        <div className="publication-chat-page__body flex min-h-0 flex-1 flex-col px-4 py-3.5 sm:px-6 sm:py-4">
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
