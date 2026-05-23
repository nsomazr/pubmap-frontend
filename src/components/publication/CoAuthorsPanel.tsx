import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import type { CollaborationNetworkData, CoAuthorPerson, Publication, PublicationCoAuthors } from "../../types";
import { CoAuthorCard } from "./CoAuthorCard";
import { CollaborationNetwork } from "./CollaborationNetwork";

interface Props {
  publication: Publication;
}

function fallbackCoAuthors(publication: Publication): PublicationCoAuthors {
  const author = publication.author;
  const primary: CoAuthorPerson = {
    kind: "primary",
    user_id: author?.id ?? null,
    fullname:
      author?.full_name ||
      `${author?.firstname ?? ""} ${author?.lastname ?? ""}`.trim() ||
      "Lead author",
    affiliation: author?.affiliation || "",
    email: author?.email,
    role: "Lead author",
    photo: author?.photo,
    profile_url: author?.id ? `/researcher/${author.id}` : null,
    institution_map_url: author?.affiliation
      ? `/?affiliation=${encodeURIComponent(author.affiliation)}`
      : "/",
    is_registered: Boolean(author?.id),
    ranking: author?.ranking,
  };
  const coAuthors: CoAuthorPerson[] = (publication.collaborators || []).map((person) => ({
    ...person,
    kind: "coauthor",
    role: person.role || "Co-author",
  }));
  return {
    primary_author: primary,
    co_authors: coAuthors,
    team: [primary, ...coAuthors],
    total_authors: 1 + coAuthors.length,
  };
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
    <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Users className="h-5 w-5 text-brand-600" />
            Research team
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {coAuthors.total_authors} author{coAuthors.total_authors !== 1 ? "s" : ""} on this
            publication
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <CoAuthorCard person={coAuthors.primary_author} highlight />
        {coAuthors.co_authors.map((person) => (
          <CoAuthorCard key={person.id ?? `${person.fullname}-${person.email}`} person={person} />
        ))}
      </div>

      {network && network.nodes.length > 1 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink">Collaboration network</h3>
          <p className="mt-1 text-xs text-slate-500">
            Explore how the research team connects on GRE. Click a node to open a profile.
          </p>
          <div className="mt-4">
            <CollaborationNetwork
              network={network}
              onNodeClick={(path) => navigate(path)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
