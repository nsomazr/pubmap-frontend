import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, MessageSquare, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { greAccentBadge, greIconBrand, greIconTeal } from "../lib/greTheme";
import { institutionMapUrl } from "../lib/institutionLinks";
import {
  INSTITUTION_PUBS_PER_STAR,
  INSTITUTION_SORT_OPTIONS,
  RESEARCHER_PUBS_PER_STAR,
  RESEARCHER_SORT_OPTIONS,
  institutionSortDescription,
  researcherSortDescription,
} from "../lib/rankings";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { ResearcherBadges } from "../components/rankings/ResearcherBadges";
import { StarRating } from "../components/rankings/StarRating";
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
  options: { value: T; label: string; description?: string }[];
}) {
  return (
    <label className="inline-flex max-w-full flex-col gap-1.5 text-sm text-slate-600 sm:items-end">
      <span className="inline-flex items-center gap-2 font-medium">
        Sort by
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </span>
      {options.find((opt) => opt.value === value)?.description && (
        <span className="max-w-xl text-xs leading-relaxed text-slate-500 sm:text-right">
          {options.find((opt) => opt.value === value)?.description}
        </span>
      )}
    </label>
  );
}

export function RankingsPage() {
  const [tab, setTab] = useState<Tab>("institutions");
  const [instSort, setInstSort] = useState<InstitutionRankingSort>("publications");
  const [researcherSort, setResearcherSort] = useState<ResearcherRankingSort>("publications");

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
      accent="teal"
      badge="Community & impact"
      title="Research Rankings"
      subtitle="Institutional recognition and researcher contributions across the GRE map, measured by published work, community activity, and growth."
      crumbs={[{ label: "Home", to: "/" }, { label: "Rankings" }]}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200/80">
          <button
            type="button"
            onClick={() => setTab("institutions")}
            className={`gre-interactive inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === "institutions"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Institution rankings
          </button>
          <button
            type="button"
            onClick={() => setTab("researchers")}
            className={`gre-interactive inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === "researchers"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Researcher rankings
          </button>
        </div>

        {tab === "institutions" ? (
          <SortSelect value={instSort} onChange={setInstSort} options={INSTITUTION_SORT_OPTIONS} />
        ) : (
          <SortSelect
            value={researcherSort}
            onChange={setResearcherSort}
            options={RESEARCHER_SORT_OPTIONS}
          />
        )}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Institution stars
          </p>
          <p className="mt-1 text-sm text-slate-600">
            1 star per {INSTITUTION_PUBS_PER_STAR.toLocaleString()} published studies linked to an
            institution.
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-white p-4 ring-1 ring-teal-100">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Researcher stars
          </p>
          <p className="mt-1 text-sm text-slate-600">
            1 star per {RESEARCHER_PUBS_PER_STAR} published studies by an author on the map.
          </p>
        </div>
      </div>

      <p className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600">
        {tab === "institutions"
          ? institutionSortDescription(instSort)
          : researcherSortDescription(researcherSort)}
      </p>

      {tab === "institutions" ? (
        instLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">No institution data yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Rankings appear as published studies include affiliations.
            </p>
          </div>
        ) : (
          <div className="gre-stagger space-y-3">
            {institutions.map((inst, index) => (
              <article
                key={inst.slug}
                className="gre-card gre-card-hover group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`${greAccentBadge} h-12 w-12 shrink-0 rounded-2xl text-lg shadow-md`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-ink group-hover:text-brand-700">
                      <Link
                        to={inst.map_url || institutionMapUrl(inst.name)}
                        className="hover:underline"
                      >
                        {inst.name}
                      </Link>
                    </h2>
                    <div className="mt-2">
                      <StarRating stars={inst.stars} size="lg" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
                        <Building2 className="h-3.5 w-3.5 text-brand-600" />
                        {inst.total_publications.toLocaleString()} publications
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
                        <Users className="h-3.5 w-3.5 text-teal-600" />
                        {inst.total_researchers.toLocaleString()} researchers
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
                        <MessageSquare className={`h-3.5 w-3.5 ${greIconTeal}`} />
                        {inst.total_discussions.toLocaleString()} discussions
                      </span>
                      {instSort === "growth" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-800">
                          <TrendingUp className={`h-3.5 w-3.5 ${greIconBrand}`} />
                          {inst.growth_rate > 0 ? "+" : ""}
                          {inst.growth_rate}% growth
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : resLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : researchers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">No researcher rankings yet</p>
        </div>
      ) : (
        <div className="gre-stagger space-y-3">
          {researchers.map((person, index) => (
            <article
              key={person.user_id}
              className="gre-card gre-card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="relative shrink-0">
                  <UserAvatar
                    name={person.name}
                    photoUrl={person.photo}
                    size="md"
                    className="h-14 w-14 border-2 border-white text-lg shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-700 ring-2 ring-brand-100">
                    {index + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">
                    <Link
                      to={`/researcher/${person.user_id}`}
                      className="transition hover:text-brand-700"
                    >
                      {person.name}
                    </Link>
                  </h2>
                  {person.affiliation && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">{person.affiliation}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StarRating stars={person.stars} />
                    <ResearcherBadges badges={person.badges} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {person.published_count} published · {person.discussion_count} discussion
                    contributions
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
}
