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
import type { Publication } from "../types";

export function PublicationChatPage() {
  const { id } = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ["publication", id],
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${id}/public/`);
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
        { label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""), to: `/publication/${pub.id}` },
        { label: "Chat" },
      ]}
      back={{ to: "/", label: "Back to map" }}
    >
      <div className="gre-card overflow-hidden">
        <header className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-4">
            <UserAvatar
              user={pub.author}
              size="md"
              className="!h-12 !w-12 shrink-0 !border-2 !text-sm"
            />
            <div className="min-w-0 flex-1">
              {subVisual && (
                <div className="mb-2 flex items-center gap-2">
                  <SubcategoryVisual visual={subVisual} size="sm" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                    {subVisual.name}
                  </span>
                </div>
              )}
              <h1 className="text-lg font-semibold leading-snug text-ink sm:text-xl">
                {crumbTitle}
              </h1>
              {author && <p className="mt-1 text-sm text-slate-600">{author}</p>}
              {locationLabel && (
                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{locationLabel}</span>
                </p>
              )}
            </div>
            <Link
              to={`/publication/${pub.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            >
              <ExternalLink className="h-4 w-4" />
              Full publication
            </Link>
          </div>
        </header>

        <div className="border-b border-brand-100 bg-brand-50/40 px-5 py-3 sm:px-6">
          <p className="flex items-center gap-2 text-sm text-brand-800">
            <Sparkles className="h-4 w-4 shrink-0" />
            GRE Assistant is summarizing this study. Ask about methods, findings, authors, or location below.
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <PublicationSummaryAssistant
            publicationId={pub.id}
            autoGenerate
            layout="page"
            scrollContainerRef={scrollRef}
          />
        </div>
      </div>
    </PublicPageLayout>
  );
}
