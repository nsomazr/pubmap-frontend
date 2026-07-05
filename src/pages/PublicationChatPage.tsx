import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicationChatWorkspace } from "../components/publication/PublicationChatWorkspace";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
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

  const layoutProps = {
    compactHero: true as const,
    fillViewport: true as const,
    denseMobileHero: true as const,
    workspaceMode: "chat" as const,
    title: "Research Assistant",
  };

  if (isLoading) {
    return (
      <PublicPageLayout {...layoutProps} crumbs={[{ label: "Home", to: "/" }, { label: "Loading…" }]}>
        <p className="px-4 py-8 text-sm text-slate-500 sm:px-0">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !pub) {
    return (
      <PublicPageLayout
        {...layoutProps}
        crumbs={[{ label: "Home", to: "/" }, { label: "Not found" }]}
      >
        <p className="px-4 py-8 text-sm text-slate-600 sm:px-0">Publication not found.</p>
      </PublicPageLayout>
    );
  }

  const crumbTitle = formatGrePaperTitle(pub.title, pub.short_number);

  return (
    <PublicPageLayout
      {...layoutProps}
      crumbs={[
        { label: "Home", to: "/" },
        {
          label: crumbTitle.slice(0, 48) + (crumbTitle.length > 48 ? "…" : ""),
          to: buildPublicationPath(pub.id, pub.encoded_id),
        },
        { label: "Assistant" },
      ]}
    >
      <PublicationChatWorkspace publication={pub} scrollContainerRef={scrollRef} />
    </PublicPageLayout>
  );
}
