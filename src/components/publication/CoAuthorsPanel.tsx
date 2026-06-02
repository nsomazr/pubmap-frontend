import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { publicationCoAuthorsFromPublication } from "../../lib/publicationAuthors";
import type { CollaborationNetworkData, Publication } from "../../types";
import { CoAuthorCard } from "./CoAuthorCard";
import { CollaborationNetwork } from "./CollaborationNetwork";
import { PublicationPageSection } from "./PublicationPageSection";

interface Props {
  publication: Publication;
}

function fallbackCoAuthors(publication: Publication) {
  return publicationCoAuthorsFromPublication(publication);
}

export function CoAuthorsPanel({ publication }: Props) {
  const navigate = useNavigate();
  const coAuthors = publication.co_authors ?? fallbackCoAuthors(publication);

  const { data: network } = useQuery({
    queryKey: ["collaboration-network", publication.id],
    queryFn: async () => {
      const { data } = await api.get<CollaborationNetworkData>(
        `/publications/${publication.id}/public/collaboration-network/`
      );
      return data;
    },
    enabled: coAuthors.total_authors > 1,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PublicationPageSection
      id="research-team"
      title="Research team"
      icon={Users}
      description={
        <>
          {coAuthors.total_authors} author{coAuthors.total_authors !== 1 ? "s" : ""} on this
          publication
        </>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <CoAuthorCard person={coAuthors.primary_author} highlight />
        {coAuthors.co_authors.map((person) => (
          <CoAuthorCard key={person.id ?? `${person.fullname}-${person.email}`} person={person} />
        ))}
      </div>

      {network && network.nodes.length > 1 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Collaboration network
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            This graph maps author relationships on GRE. Solid lines connect people listed on this
            publication (lead author at the center). Dashed lines show other shared published work
            between registered GRE members. Thicker lines mean more co-authored studies. Click a
            node to open a researcher profile.
          </p>
          <div className="mt-4">
            <CollaborationNetwork network={network} onNodeClick={(path) => navigate(path)} />
          </div>
        </div>
      )}
    </PublicationPageSection>
  );
}
