import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StatDisplayTile } from "../components/dashboard/StatDisplayTile";
import { greBarSecondary, greChipTopic, greIconBrand } from "../lib/greTheme";
import { asTrendMonthPoints } from "../lib/sparkline";
import {
  BarChart3,
  Building2,
  Globe2,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatGrePaperTitle } from "../lib/grePaperTitle";
import { buildPublicationPath } from "../lib/publicationPaths";
import api from "../lib/api";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicEmptyState } from "../components/layout/PublicEmptyState";
import { PublicSection } from "../components/layout/PublicSection";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { AnimatedCounter } from "../components/stats/AnimatedCounter";
import { CompositionChart } from "../components/stats/CompositionChart";
import { CountryHeatGrid, CountryHeatGridHint } from "../components/stats/CountryHeatGrid";
import { HorizontalBarChart } from "../components/stats/HorizontalBarChart";
import { StatsDensityMap } from "../components/stats/StatsDensityMap";
import { TrendLineChart } from "../components/stats/TrendLineChart";
import { RankedNameLabel } from "../components/rankings/RankedNameLabel";
import type { PublicResearchStats } from "../types";

export function StatisticsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats", "public"],
    queryFn: async () => {
      const { data: payload } = await api.get<PublicResearchStats>("/stats/public/");
      return payload;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PublicPageLayout
      wide
      compactHero
      title="Statistics"
      subtitle="Published studies, institutions, and trends across GRE."
      crumbs={[{ label: "Home", to: "/" }, { label: "Statistics" }]}
    >
      <GreAdPlacement
        placement="statistics_banner"
        variant="banner"
        limit={1}
        rotate
        className="mb-6"
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="gre-skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <PublicEmptyState
          icon={BarChart3}
          title="Statistics unavailable"
          description="Try refreshing the page in a moment."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatDisplayTile
              label="Publications"
              value={<AnimatedCounter value={data.totals.publications} />}
              icon={BarChart3}
              trendPoints={asTrendMonthPoints(data.publication_trend)}
              chartColor="#3b5bdb"
              hint="Published on GRE"
            />
            <StatDisplayTile
              label="Researchers"
              value={<AnimatedCounter value={data.totals.researchers} />}
              icon={Users}
              chartColor="#0d9488"
              hint="Authors with published work"
            />
            <StatDisplayTile
              label="Geolocated"
              value={<AnimatedCounter value={data.totals.with_coordinates} />}
              icon={Globe2}
              chartColor="#14b8a6"
              ratio={{
                value: data.totals.with_coordinates,
                max: data.totals.publications,
                label: "Publications on the map",
                color: "#14b8a6",
              }}
              hint="Visible on the map"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PublicSection title="By field">
              <HorizontalBarChart
                items={data.publications_by_category.map((row) => ({
                  label: row.name,
                  value: row.count,
                }))}
                colorClass={greBarSecondary}
              />
            </PublicSection>

            <PublicSection title="By subfield">
              <CompositionChart
                items={data.publications_by_subcategory.map((row) => ({
                  id: `${row.category}::${row.subcategory}`,
                  label: row.subcategory,
                  hint: row.category,
                  value: row.count,
                }))}
                caption="Tile size reflects each subfield’s share of published work."
              />
            </PublicSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PublicSection title="By location">
              <CountryHeatGrid
                countries={data.publications_by_country}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
              <CountryHeatGridHint selectedCountry={selectedCountry} />
            </PublicSection>

            <PublicSection title="Heatmap">
              <StatsDensityMap
                points={data.map_heatmap}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
            </PublicSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PublicSection title="Publication trend">
              <TrendLineChart points={data.publication_trend} />
            </PublicSection>

            <PublicSection title="Trending topics">
              {data.trending_topics.length === 0 ? (
                <p className="text-sm text-slate-500">No recent topic activity yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.trending_topics.map((topic) => (
                    <span
                      key={`${topic.category}-${topic.topic}`}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ${greChipTopic}`}
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${greIconBrand}`} />
                      <span className="font-medium text-ink">{topic.topic}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-teal-700">
                        +{topic.recent_publications}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {data.trending_keywords.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.trending_keywords.map((kw) => (
                      <span
                        key={kw.label}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {kw.label} ({kw.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </PublicSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PublicSection
              title="Leading institutions"
              subtitle="By publications, discussions, and responses"
            >
              {data.top_institutions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Institution data appears when affiliations are linked to publications.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.top_institutions.map((inst, index) => (
                    <article
                      key={inst.slug}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-brand-700 ring-1 ring-slate-200">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <RankedNameLabel
                            name={inst.name}
                            stars={inst.stars}
                            nameClassName="truncate text-sm font-semibold text-ink"
                            compact
                            showBadges={false}
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {inst.total_publications} published ·{" "}
                          {inst.total_conversations ?? inst.total_discussions} discussions
                          {inst.total_responses != null ? ` · ${inst.total_responses} responses` : ""}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <Link
                to="/rankings"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Full rankings
                <TrendingUp className="h-4 w-4" />
              </Link>
            </PublicSection>

            <PublicSection title="Most discussed papers">
              {data.most_discussed_papers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Discussion metrics appear as readers engage with publications.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.most_discussed_papers.map((paper, index) => (
                    <Link
                      key={paper.id}
                      to={buildPublicationPath(paper.id, paper.encoded_id)}
                      className="group flex gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-brand-700">
                          {formatGrePaperTitle(paper.title, paper.short_number)}
                        </h3>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {paper.conversations} discussions
                          </span>
                          <span>{paper.replies} responses</span>
                          <span>{paper.views.toLocaleString()} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </PublicSection>
          </div>

          {data.generated_at && (
            <p className="text-center text-xs text-slate-400">
              Updated {new Date(data.generated_at).toLocaleString()} · refreshes every 5 minutes
            </p>
          )}
        </div>
      )}
    </PublicPageLayout>
  );
}
