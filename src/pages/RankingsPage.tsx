import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { greAccentBadge, greIconBrand } from "../lib/greTheme";
import { institutionMapUrl } from "../lib/institutionLinks";
import { INSTITUTION_SORT_OPTIONS, RESEARCHER_SORT_OPTIONS } from "../lib/rankings";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
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
  options: { value: T; label: string; description?: string }[];
}) {
  return (
    <label className="inline-flex max-w-full flex-col gap-1.5 text-sm text-slate-600 sm:items-end">
      <span className="inline-flex items-center gap-2 font-medium">
        Sort by
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm focus:border-brand-500 gre-field focus:outline-none focus:ring-0"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </span>
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
      accent="teal"
      badge="Community & impact"
      title="Research Rankings"
      crumbs={[{ label: "Home", to: "/" }, { label: "Rankings" }]}
    >
      <PageAdAside primaryPlacement="rankings_sidebar" secondaryPlacement="research_tool">
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
                        <RankedNameLabel
                          name={inst.name}
                          stars={inst.stars}
                          nameClassName="text-lg font-semibold text-ink group-hover:text-brand-700"
                          showBadges={false}
                        />
                      </Link>
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {inst.total_publications.toLocaleString()} published ·{" "}
                      {(inst.total_conversations ?? inst.total_discussions).toLocaleString()}{" "}
                      {(inst.total_conversations ?? inst.total_discussions) === 1
                        ? "discussion"
                        : "discussions"}
                      {inst.total_responses != null ? (
                        <>
                          {" "}
                          · {inst.total_responses.toLocaleString()}{" "}
                          {inst.total_responses === 1 ? "response" : "responses"}
                        </>
                      ) : null}
                      {" · "}
                      {inst.total_researchers.toLocaleString()}{" "}
                      {inst.total_researchers === 1 ? "researcher" : "researchers"}
                    </p>
                    {instSort === "growth" ? (
                      <p className="mt-1 text-xs font-semibold text-brand-800">
                        <TrendingUp className={`mr-1 inline h-3.5 w-3.5 ${greIconBrand}`} />
                        {inst.growth_rate > 0 ? "+" : ""}
                        {inst.growth_rate}% growth (90-day)
                      </p>
                    ) : null}
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
                      <RankedNameLabel
                        name={person.name}
                        ranking={person}
                        nameClassName="font-semibold text-ink transition group-hover:text-brand-700"
                      />
                    </Link>
                  </h2>
                  {person.affiliation && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">{person.affiliation}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {person.published_count} published ·{" "}
                    {person.conversation_count ?? person.discussion_count}{" "}
                    {(person.conversation_count ?? person.discussion_count) === 1
                      ? "discussion"
                      : "discussions"}
                    {person.response_count != null ? (
                      <>
                        {" "}
                        · {person.response_count}{" "}
                        {person.response_count === 1 ? "response" : "responses"}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      </PageAdAside>
    </PublicPageLayout>
  );
}
