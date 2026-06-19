import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import { buildPublicationPath } from "../lib/publicationPaths";
import api from "../lib/api";
import { institutionMapUrl } from "../lib/institutionLinks";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { CollaborationNetwork } from "../components/publication/CollaborationNetwork";
import { RankedNameLabel } from "../components/rankings/RankedNameLabel";
import { GreHeroBanner } from "../components/ui/GreHeroBanner";
import type { PublicResearcherProfile } from "../types";

export function ResearcherProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = id && /^\d+$/.test(id) ? Number(id) : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["researcher-profile", userId],
    queryFn: async () => {
      const { data: payload } = await api.get<PublicResearcherProfile>(
        `/researchers/${userId}/public/`
      );
      return payload;
    },
    enabled: Boolean(userId),
  });

  if (!userId) {
    return (
      <PublicPageLayout compactHero title="Researcher" crumbs={[{ label: "Home", to: "/" }]}>
        <p className="text-slate-600">Invalid profile link.</p>
      </PublicPageLayout>
    );
  }

  if (isLoading) {
    return (
      <PublicPageLayout compactHero title="Researcher profile" crumbs={[{ label: "Home", to: "/" }]}>
        <p className="text-slate-500">Loading profile…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !data) {
    return (
      <PublicPageLayout
        compactHero
        title="Not found"
        crumbs={[{ label: "Home", to: "/" }]}
        back={{ to: "/rankings", label: "Browse rankings" }}
      >
        <p className="text-slate-600">This researcher profile is not available.</p>
      </PublicPageLayout>
    );
  }

  const { user, ranking, authored_publications, co_authored_publications, collaboration_network } =
    data;
  const name = user.full_name || `${user.firstname} ${user.lastname}`.trim();
  const initials = `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase() || "?";
  const institutionLink = data.institution_map_url || institutionMapUrl(user.affiliation);

  return (
    <PublicPageLayout
      wide
      compactHero
      accent="teal"
      badge="Researcher profile"
      title={name}
      subtitle={user.area_of_study || user.affiliation || "Global Research Exchange contributor"}
      crumbs={[{ label: "Home", to: "/" }, { label: "Researcher" }]}
    >
      <GreHeroBanner
        compact
        className="mb-6"
        photoUrl={user.photo}
        initials={initials}
        title={
          <RankedNameLabel
            name={name}
            nameClassName="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            ranking={ranking}
            registered
          />
        }
        subtitle={
          user.affiliation ? (
            <Link
              to={institutionLink}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700"
            >
              <Building2 className="h-4 w-4" />
              {user.affiliation}
            </Link>
          ) : (
            user.area_of_study || "Global Research Exchange contributor"
          )
        }
        meta={
          <p className="text-sm text-slate-600">
            {ranking.published_count} published · {ranking.discussion_count}{" "}
            {ranking.discussion_count === 1 ? "discussion" : "discussions"}
          </p>
        }
      />

      {collaboration_network.nodes.length > 1 && (
        <section className="mb-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200/80 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Users className="h-5 w-5 text-brand-600" />
            Collaboration network
          </h2>
          <div className="mt-4">
            <CollaborationNetwork
              network={{
                publication_id: 0,
                publication_title: name,
                nodes: collaboration_network.nodes,
                edges: collaboration_network.edges,
              }}
              onNodeClick={(path) => navigate(path)}
            />
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <FileText className="h-5 w-5 text-brand-600" />
            Authored publications
          </h2>
          <ul className="mt-4 space-y-3">
            {authored_publications.length === 0 ? (
              <li className="text-sm text-slate-500">No published studies yet.</li>
            ) : (
              authored_publications.map((pub) => (
                <li key={pub.id}>
                  <Link
                    to={buildPublicationPath(pub.id, pub.encoded_id)}
                    className="block rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm transition hover:border-brand-200 hover:bg-white"
                  >
                    <p className="font-semibold text-ink">
                      {formatGrePaperTitle(pub.title, pub.short_number)}
                    </p>
                    {pub.sub_category_name && (
                      <p className="mt-1 text-xs text-slate-500">{pub.sub_category_name}</p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/80">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Users className="h-5 w-5 text-teal-600" />
            Co-authored publications
          </h2>
          <ul className="mt-4 space-y-3">
            {co_authored_publications.length === 0 ? (
              <li className="text-sm text-slate-500">No co-authored GRE publications yet.</li>
            ) : (
              co_authored_publications.map((pub) => (
                <li key={pub.id}>
                  <Link
                    to={buildPublicationPath(pub.id, pub.encoded_id)}
                    className="block rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm transition hover:border-brand-200 hover:bg-white"
                  >
                    <p className="font-semibold text-ink">
                      {formatGrePaperTitle(pub.title, pub.short_number)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lead author:{" "}
                      {pub.author?.full_name ||
                        `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim()}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {user.interests && user.interests.length > 0 && (
        <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200/80">
          <h2 className="font-semibold text-ink">Research interests</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.interests.map((interest) => (
              <span
                key={interest.id}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100"
              >
                {interest.label}
              </span>
            ))}
          </div>
        </section>
      )}
    </PublicPageLayout>
  );
}
