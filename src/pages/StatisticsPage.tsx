import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  greAccentBadge,
  greBarPrimary,
  greBarSecondary,
  greChipTopic,
  greIconBrand,
  greIconTeal,
  greStatBgBrand,
  greStatBgTeal,
} from "../lib/greTheme";
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
import { StarRating } from "../components/rankings/StarRating";
import type { PublicResearchStats } from "../types";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof BarChart3;
  accent: string;
}) {
  return (
    <article className={`gre-card gre-card-hover bg-gradient-to-br ${accent} p-5 ring-white/60`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-ink sm:text-4xl">
            <AnimatedCounter value={value} />
          </p>
          <p className="mt-2 text-sm text-slate-600">{hint}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3 shadow-sm">
          <Icon className="h-6 w-6 text-brand-600" />
        </div>
      </div>
    </article>
  );
}

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
    <section className="gre-card p-5 sm:p-6">
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
      subtitle="Live platform metrics: publications, geography, institutions, and community engagement. No account required."
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 gre-stagger">
            <StatCard
              label="Total publications"
              value={data.totals.publications}
              hint="Published studies on the public map"
              icon={BarChart3}
              accent={greStatBgBrand}
            />
            <StatCard
              label="Total researchers"
              value={data.totals.researchers}
              hint="Authors with at least one published study"
              icon={Users}
              accent={greStatBgTeal}
            />
            <StatCard
              label="Geolocated studies"
              value={data.totals.with_coordinates}
              hint="Publications with map coordinates"
              icon={Globe2}
              accent="from-brand-50 to-teal-50/30"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section
              title="Publications by field"
              subtitle="Distribution across GRE research domains"
            >
              <HorizontalBarChart
                items={data.publications_by_category.map((row) => ({
                  label: row.name,
                  value: row.count,
                }))}
                colorClass={greBarSecondary}
              />
            </Section>

            <Section
              title="Publications by subfield"
              subtitle="Top thematic areas within each field"
            >
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

          <div className="grid gap-6 xl:grid-cols-2">
            <Section
              title="Publications by country"
              subtitle="Inferred from study location labels on the map"
            >
              <CountryHeatGrid
                countries={data.publications_by_country}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
              <CountryHeatGridHint selectedCountry={selectedCountry} />
            </Section>

            <Section title="Geographic heatmap" subtitle="Publication density by country centroid">
              <StatsDensityMap
                points={data.map_heatmap}
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
              <p className="mt-3 text-xs text-slate-500">
                Click a region to see its publication count and open those studies on the main map.
              </p>
            </Section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section
              title="Publication trend"
              subtitle="Monthly published studies over the last year"
            >
              <TrendLineChart points={data.publication_trend} />
            </Section>

            <Section
              title="Trending topics"
              subtitle="Subfields with the most new publications (90 days)"
            >
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

          <div className="grid gap-6 xl:grid-cols-2">
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
                          <h3 className="truncate font-semibold text-ink">{inst.name}</h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{inst.total_publications} publications</span>
                          <span>{inst.total_researchers} researchers</span>
                          <StarRating stars={inst.stars} size="sm" />
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

            <Section
              title="Most discussed papers"
              subtitle="Ranked by conversations, replies, and page views"
            >
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
                            {paper.conversations} threads
                          </span>
                          <span>{paper.replies} replies</span>
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
