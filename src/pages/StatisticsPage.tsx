import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StatDisplayTile } from "../components/dashboard/StatDisplayTile";
import {
  greAccentBadge,
  greBarPrimary,
  greBarSecondary,
  greChipTopic,
  greIconBrand,
} from "../lib/greTheme";
import { trendToSparkline } from "../lib/sparkline";
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
import { AnimatedCounter } from "../components/stats/AnimatedCounter";
import { CountryHeatGrid, CountryHeatGridHint } from "../components/stats/CountryHeatGrid";
import { HorizontalBarChart } from "../components/stats/HorizontalBarChart";
import { StatsDensityMap } from "../components/stats/StatsDensityMap";
import { TrendLineChart } from "../components/stats/TrendLineChart";
import { RankedNameLabel } from "../components/rankings/RankedNameLabel";
import type { PublicResearchStats } from "../types";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="gre-dashboard-card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

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
      accent="blue"
      badge="Open data"
      title="Research Statistics"
      crumbs={[{ label: "Home", to: "/" }, { label: "Statistics" }]}
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="gre-skeleton h-36" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">Statistics unavailable</p>
          <p className="mt-1 text-sm text-slate-400">Try refreshing the page in a moment.</p>
        </div>
      ) : (
        <div className="gre-section-stack">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 gre-stagger">
            <StatDisplayTile
              label="Total publications"
              value={<AnimatedCounter value={data.totals.publications} />}
              icon={BarChart3}
              sparkline={trendToSparkline(data.publication_trend)}
              sparklineColor="#3b5bdb"
              hint="Published on GRE · last 12 months trend"
            />
            <StatDisplayTile
              label="Total researchers"
              value={<AnimatedCounter value={data.totals.researchers} />}
              icon={Users}
              sparklineColor="#0d9488"
              hint="Authors with published work"
            />
            <StatDisplayTile
              label="Geolocated studies"
              value={<AnimatedCounter value={data.totals.with_coordinates} />}
              icon={Globe2}
              sparklineColor="#14b8a6"
              hint="Visible on the research map"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Publications by field">
              <HorizontalBarChart
                items={data.publications_by_category.map((row) => ({
                  label: row.name,
                  value: row.count,
                }))}
                colorClass={greBarSecondary}
              />
            </Section>

            <Section title="Publications by subfield">
              <HorizontalBarChart
                items={data.publications_by_subcategory.map((row) => ({
                  label: row.subcategory,
                  value: row.count,
                  hint: row.category,
                }))}
                colorClass={greBarPrimary}
              />
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Publications by country">
              <CountryHeatGrid
                countries={data.publications_by_country}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
              <CountryHeatGridHint selectedCountry={selectedCountry} />
            </Section>

            <Section title="Geographic heatmap">
              <StatsDensityMap
                points={data.map_heatmap}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Publication trend">
              <TrendLineChart points={data.publication_trend} />
            </Section>

            <Section title="Trending topics">
              {data.trending_topics.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No recent topic activity yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.trending_topics.map((topic) => (
                    <span
                      key={`${topic.category}-${topic.topic}`}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ring-1 ${greChipTopic}`}
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
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Trending keywords
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
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Most active institutions" subtitle="Top contributors by publication count">
              {data.top_institutions.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Institution data appears when affiliations are linked to publications.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.top_institutions.map((inst, index) => (
                    <article
                      key={inst.slug}
                      className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
                    >
                      <div
                        className={`${greAccentBadge} h-10 w-10 shrink-0 rounded-xl text-sm shadow-sm`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                          <h3 className="min-w-0 truncate font-semibold text-ink">
                            <RankedNameLabel
                              name={inst.name}
                              stars={inst.stars}
                              nameClassName="truncate font-semibold text-ink"
                              compact
                              showBadges={false}
                            />
                          </h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{inst.total_publications} publications</span>
                          <span>{inst.total_researchers} researchers</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <Link
                to="/rankings"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View full rankings
                <TrendingUp className="h-4 w-4" />
              </Link>
            </Section>

            <Section title="Most discussed papers">
              {data.most_discussed_papers.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Discussion metrics appear as readers engage with publications.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.most_discussed_papers.map((paper, index) => (
                    <Link
                      key={paper.id}
                      to={buildPublicationPath(paper.id, paper.encoded_id)}
                      className="group flex gap-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 transition hover:bg-brand-50/60 hover:ring-brand-200"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-semibold text-ink group-hover:text-brand-700">
                          {formatGrePaperTitle(paper.title, paper.short_number)}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {paper.conversations}{" "}
                            {paper.conversations === 1 ? "discussion" : "discussions"}
                          </span>
                          <span>
                            {paper.replies}{" "}
                            {paper.replies === 1 ? "response" : "responses"}
                          </span>
                          <span>{paper.views.toLocaleString()} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {data.generated_at && (
            <p className="text-center text-xs text-slate-400">
              Last updated {new Date(data.generated_at).toLocaleString()} · Refreshes every 5 minutes
            </p>
          )}
        </div>
      )}
    </PublicPageLayout>
  );
}
