import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
  Activity as ActivityIcon,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import api from "../../lib/api";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatDisplayTile } from "../../components/dashboard/StatDisplayTile";
import type { TrendMonthPoint } from "../../lib/sparkline";
import { formatTrendMonthLabel } from "../../lib/chartFormat";
import { buildDashboardPublicationPath } from "../../lib/publicationPaths";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../lib/userAccess";

type AdminAnalyticsResponse = {
  activity: {
    totals: Record<string, number>;
    trend: Record<string, TrendMonthPoint[]>;
  };
  users: {
    totals: {
      active_users: number;
      active_admins: number;
      active_authors: number;
    };
    new_admins_trend: TrendMonthPoint[];
    new_authors_trend: TrendMonthPoint[];
  };
  engagement: {
    totals: {
      conversations: number;
      replies: number;
      views: number;
    };
    trend: {
      conversations: TrendMonthPoint[];
      replies: TrendMonthPoint[];
      views: TrendMonthPoint[];
    };
    top_publications: Array<{
      encoded_id: string;
      title: string;
      short_number: string | null;
      views: number;
    }>;
  };
};

type TabId = "activity" | "users" | "engagement";

const TABS: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "activity", label: "Activity", icon: <ActivityIcon className="h-4 w-4" /> },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "engagement", label: "Engagement", icon: <TrendingUp className="h-4 w-4" /> },
];

function pickTrend(trend: Record<string, TrendMonthPoint[]>, key: string): TrendMonthPoint[] {
  return trend?.[key] ?? [];
}

export function AdminAnalyticsPage() {
  const { user } = useAuth();

  const isAdmin = isPlatformAdmin(user);
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const [tab, setTab] = useState<TabId>("activity");
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: async () => {
      const { data: payload } = await api.get<AdminAnalyticsResponse>("/admin/analytics/", {
        params: { days },
      });
      return payload;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const activity = data?.activity;
  const users = data?.users;
  const engagement = data?.engagement;

  const currentMonthLabel = useMemo(() => {
    const latest = (users?.new_authors_trend ?? []).slice(-1)[0]?.month;
    return latest ? formatTrendMonthLabel(latest) : "";
  }, [users?.new_authors_trend]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform-wide activity, user growth, and engagement metrics (admin only)."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/90 p-1.5 ring-1 ring-slate-200/70">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="mr-2 inline-flex align-middle">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Engagement window
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="gre-skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Analytics unavailable. Try again shortly.
          <div className="mt-3">
            <button
              type="button"
              className="rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {tab === "activity" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatDisplayTile
                label="Published"
                value={activity?.totals?.published ?? 0}
                icon={CheckCircle2}
                chartColor="#0d9488"
                trendPoints={pickTrend(activity?.trend ?? {}, "published")}
                hint="Approved and live on the map"
              />
              <StatDisplayTile
                label="Pending review"
                value={activity?.totals?.pending_review ?? 0}
                icon={Clock}
                chartColor="#7c3aed"
                trendPoints={pickTrend(activity?.trend ?? {}, "pending_review")}
                hint="Awaiting GRE decision"
              />
              <StatDisplayTile
                label="Needs revision"
                value={activity?.totals?.revision ?? 0}
                icon={MessageSquare}
                chartColor="#d97706"
                trendPoints={pickTrend(activity?.trend ?? {}, "revision")}
                hint="Has feedback to address"
              />
              <StatDisplayTile
                label="Drafts"
                value={activity?.totals?.drafts ?? 0}
                icon={Calendar}
                chartColor="#64748b"
                trendPoints={pickTrend(activity?.trend ?? {}, "drafts")}
                hint="Work in progress"
              />
              <StatDisplayTile
                label="Submitted"
                value={activity?.totals?.submitted ?? 0}
                icon={BarChart3}
                chartColor="#3b5bdb"
                trendPoints={pickTrend(activity?.trend ?? {}, "submitted")}
                hint="Everything except drafts"
              />
            </div>
          )}

          {tab === "users" && (
            <section className="gre-panel">
              <div className="gre-panel__head px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">New users</h2>
                <p className="mt-1 text-xs text-slate-500">New platform signups by role (last {8} months).</p>
              </div>
              <div className="gre-panel__body p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatDisplayTile
                    label="Active admins"
                    value={users?.totals.active_admins ?? 0}
                    icon={Users}
                    hint="Users with platform admin access"
                  />
                  <StatDisplayTile
                    label="Active authors"
                    value={users?.totals.active_authors ?? 0}
                    icon={Users}
                    hint="Researchers (author role)"
                  />
                  <StatDisplayTile
                    label="Active users"
                    value={users?.totals.active_users ?? 0}
                    icon={Users}
                    hint="Total active accounts"
                  />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <StatDisplayTile
                    label="New admins"
                    value={(users?.new_admins_trend ?? []).reduce((s, r) => s + r.count, 0)}
                    icon={Users}
                    trendPoints={users?.new_admins_trend ?? []}
                    chartColor="#3b5bdb"
                    hint={`Monthly admin signups. Latest month: ${currentMonthLabel || "—"}`}
                  />
                  <StatDisplayTile
                    label="New authors"
                    value={(users?.new_authors_trend ?? []).reduce((s, r) => s + r.count, 0)}
                    icon={Users}
                    trendPoints={users?.new_authors_trend ?? []}
                    chartColor="#0d9488"
                    hint={`Monthly author signups. Latest month: ${currentMonthLabel || "—"}`}
                  />
                </div>
              </div>
            </section>
          )}

          {tab === "engagement" && (
            <section className="gre-panel">
              <div className="gre-panel__head px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">Engagement</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Conversations, replies, and views (last {days} days window).
                </p>
              </div>
              <div className="gre-panel__body p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatDisplayTile
                    label="Conversations"
                    value={engagement?.totals.conversations ?? 0}
                    icon={MessageSquare}
                    trendPoints={engagement?.trend.conversations ?? []}
                    chartColor="#3b5bdb"
                    hint="Readers starting discussion threads"
                  />
                  <StatDisplayTile
                    label="Replies"
                    value={engagement?.totals.replies ?? 0}
                    icon={MessageSquare}
                    trendPoints={engagement?.trend.replies ?? []}
                    chartColor="#0d9488"
                    hint="Responses to conversations"
                  />
                  <StatDisplayTile
                    label="Views"
                    value={engagement?.totals.views ?? 0}
                    icon={BarChart3}
                    trendPoints={engagement?.trend.views ?? []}
                    chartColor="#d97706"
                    hint="Map / reader / preview views"
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Top publications by views
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aggregated (published only) for the last {days} days.
                    </p>
                  </div>
                  {engagement?.top_publications?.length ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-gre-border bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gre-panel-muted text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-2.5 font-semibold">Publication</th>
                            <th className="w-28 px-4 py-2.5 font-semibold text-right">Views</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gre-border">
                          {engagement.top_publications.map((row) => (
                            <tr key={row.encoded_id} className="hover:bg-gre-panel-muted/60">
                              <td className="px-4 py-3">
                                <Link
                                  to={buildDashboardPublicationPath(undefined, row.encoded_id)}
                                  className="font-semibold text-ink hover:text-brand-700"
                                >
                                  {row.title}
                                </Link>
                                {row.short_number ? (
                                  <p className="mt-1 text-xs text-slate-500">{row.short_number}</p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-ink">
                                {row.views}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No engagement data yet.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

