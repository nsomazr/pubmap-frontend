import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { institutionMapUrl } from "../lib/institutionLinks";
import { INSTITUTION_SORT_OPTIONS, RESEARCHER_SORT_OPTIONS } from "../lib/rankings";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicEmptyState } from "../components/layout/PublicEmptyState";
import { PublicPageTabs } from "../components/layout/PublicPageTabs";
import { PageAdAside } from "../components/ads/PageAdAside";
import { RankedNameLabel } from "../components/rankings/RankedNameLabel";
import { UserAvatar } from "../components/ui/UserAvatar";
import type {
  InstitutionRanking,
  InstitutionRankingSort,
  ResearcherLeaderboardEntry,
  ResearcherRankingSort,
} from "../types";

type Tab = "institutions" | "researchers";

function SortSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink focus:border-brand-500 gre-field focus:outline-none focus:ring-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RankingsPage() {
  const [tab, setTab] = useState<Tab>("institutions");
  const [instSort, setInstSort] = useState<InstitutionRankingSort>("leading");
  const [researcherSort, setResearcherSort] = useState<ResearcherRankingSort>("leading");

  const { data: institutions = [], isLoading: instLoading } = useQuery({
    queryKey: ["rankings", "institutions", instSort],
    queryFn: async () => {
      const { data } = await api.get<{ results: InstitutionRanking[] }>(
        "/rankings/institutions/",
        { params: { sort: instSort, limit: 100 } }
      );
      return data.results ?? [];
    },
  });

  const { data: researchers = [], isLoading: resLoading } = useQuery({
    queryKey: ["rankings", "researchers", researcherSort],
    queryFn: async () => {
      const { data } = await api.get<{ results: ResearcherLeaderboardEntry[] }>(
        "/rankings/researchers/",
        { params: { sort: researcherSort, limit: 50 } }
      );
      return data.results ?? [];
    },
  });

  return (
    <PublicPageLayout
      wide
      compactHero
      title="Rankings"
      subtitle="Institutions and researchers by publications and community impact. Stars: 1 per 500 institution papers, 1 per 10 researcher papers."
      crumbs={[{ label: "Home", to: "/" }, { label: "Rankings" }]}
    >
      <PageAdAside primaryPlacement="rankings_sidebar" secondaryPlacement="research_tool">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PublicPageTabs
            active={tab}
            onSelect={(id) => setTab(id as Tab)}
            tabs={[
              {
                kind: "button",
                id: "institutions",
                label: "Institutions",
                icon: <Building2 className="h-4 w-4" />,
              },
              {
                kind: "button",
                id: "researchers",
                label: "Researchers",
                icon: <GraduationCap className="h-4 w-4" />,
              },
            ]}
          />

          {tab === "institutions" ? (
            <SortSelect
              value={instSort}
              onChange={setInstSort}
              options={INSTITUTION_SORT_OPTIONS.map((row) => ({
                value: row.value,
                label: row.label,
              }))}
            />
          ) : (
            <SortSelect
              value={researcherSort}
              onChange={setResearcherSort}
              options={RESEARCHER_SORT_OPTIONS.map((row) => ({
                value: row.value,
                label: row.label,
              }))}
            />
          )}
        </div>

        {tab === "institutions" ? (
          instLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="gre-skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : institutions.length === 0 ? (
            <PublicEmptyState
              icon={Building2}
              title="No institution data yet"
              description="Rankings appear as published studies include affiliations."
            />
          ) : (
            <div className="space-y-2">
              {institutions.map((inst, index) => (
                <article
                  key={inst.slug}
                  className="gre-interactive gre-public-card flex items-start gap-3 p-4 sm:gap-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-ink">
                      <Link
                        to={inst.map_url || institutionMapUrl(inst.name)}
                        className="hover:text-brand-700"
                      >
                        <RankedNameLabel
                          name={inst.name}
                          stars={inst.stars}
                          nameClassName="text-base font-semibold text-ink"
                          showBadges={false}
                        />
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {inst.total_publications.toLocaleString()} published ·{" "}
                      {(inst.total_conversations ?? inst.total_discussions).toLocaleString()}{" "}
                      discussions
                      {inst.total_responses != null
                        ? ` · ${inst.total_responses.toLocaleString()} responses`
                        : ""}
                      {" · "}
                      {inst.total_researchers.toLocaleString()} researchers
                    </p>
                    {instSort === "growth" ? (
                      <p className="mt-1 text-xs font-medium text-brand-800">
                        <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
                        {inst.growth_rate > 0 ? "+" : ""}
                        {inst.growth_rate}% (90-day)
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : resLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="gre-skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : researchers.length === 0 ? (
          <PublicEmptyState
            icon={GraduationCap}
            title="No researcher rankings yet"
            description="Rankings appear for registered authors with published GRE papers."
          />
        ) : (
          <div className="space-y-2">
            {researchers.map((person, index) => (
              <article
                key={person.user_id}
                className="gre-interactive gre-public-card flex items-start gap-3 p-4 sm:gap-4"
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    name={person.name}
                    photoUrl={person.photo}
                    size="md"
                    className="h-11 w-11 border border-slate-200"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-brand-700 ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-ink">
                    <Link to={`/researcher/${person.user_id}`} className="hover:text-brand-700">
                      <RankedNameLabel
                        name={person.name}
                        ranking={person}
                        registered
                        nameClassName="font-semibold text-ink"
                      />
                    </Link>
                  </h2>
                  {person.affiliation && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">{person.affiliation}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {person.published_count} published ·{" "}
                    {person.conversation_count ?? person.discussion_count} discussions
                    {person.response_count != null ? ` · ${person.response_count} responses` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageAdAside>
    </PublicPageLayout>
  );
}
