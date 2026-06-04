import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  MapPin,
  Megaphone,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { DashboardSection } from "../../components/dashboard/DashboardSection";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { MetricTile } from "../../components/dashboard/MetricTile";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { QuickLinkTile } from "../../components/dashboard/QuickLinkTile";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { pickActivityTrend } from "../../lib/sparkline";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { authorDisplayName } from "../../lib/userDisplay";
import type { DashboardStats, Publication } from "../../types";

const QUICK_LINKS = [
  {
    to: "/dashboard/llm-settings",
    label: "LLM provider",
    description: "Groq cloud or local Ollama models",
    icon: Bot,
  },
  {
    to: "/dashboard/review",
    label: "Review queue",
    description: "Approve PDFs or request revisions",
    icon: ClipboardCheck,
  },
  {
    to: "/dashboard/plagiarism",
    label: "Plagiarism moderation",
    description: "Review claims and evidence",
    icon: MessageSquareWarning,
  },
  {
    to: "/dashboard/authors",
    label: "Users",
    description: "Authors, admins, activate accounts",
    icon: Users,
  },
  {
    to: "/dashboard/categories",
    label: "Fields",
    description: "Research taxonomy on the map",
    icon: BookOpen,
  },
  {
    to: "/dashboard/events",
    label: "Events",
    description: "Conferences and community events",
    icon: Calendar,
  },
  {
    to: "/dashboard/ads",
    label: "Advertisements",
    description: "Banners on home and static pages",
    icon: Megaphone,
  },
  {
    to: "/",
    label: "Public map",
    description: "See published research live",
    icon: MapPin,
  },
] as const;

const ADMIN_METRICS = [
  {
    label: "Pending review",
    statKey: "pending" as const,
    trendKey: "pending_review",
    icon: Clock,
    to: "/dashboard/review",
    sparkColor: "#7c3aed",
    valueClass: "text-violet-700",
  },
  {
    label: "Needs revision",
    statKey: "commented" as const,
    trendKey: "revision",
    icon: MessageSquareWarning,
    to: "/dashboard/review?status=2",
    sparkColor: "#d97706",
    valueClass: "text-amber-800",
  },
  {
    label: "Published on map",
    statKey: "published" as const,
    trendKey: "published",
    icon: CheckCircle2,
    to: "/dashboard/publications?status=3",
    sparkColor: "#0d9488",
    valueClass: "text-teal-700",
  },
  {
    label: "Active authors",
    statKey: "authors" as const,
    trendKey: null,
    icon: Users,
    to: "/dashboard/authors",
    sparkColor: "#3b5bdb",
    valueClass: "text-ink",
  },
  {
    label: "Drafts (all users)",
    statKey: "drafts" as const,
    trendKey: "drafts",
    icon: FileText,
    to: "/dashboard/publications?status=0",
    sparkColor: "#64748b",
    valueClass: "text-slate-700",
  },
] as const;

export function AdminOperationsPage() {
  const { user } = useAuth();
  if (user?.role_id !== 1) return <Navigate to="/dashboard" replace />;

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats/");
      return data;
    },
  });

  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-ops-pending"],
    queryFn: async () => {
      const { data } = await api.get<Publication[] | { results: Publication[] }>(
        "/publications/",
        { params: { status: "1" } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ["admin-ops-revisions"],
    queryFn: async () => {
      const { data } = await api.get<Publication[] | { results: Publication[] }>(
        "/publications/",
        { params: { status: "2" } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const pendingCount = stats?.pending ?? 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Admin operations"
        description="Platform moderation, review queue, and quick admin tools."
      />

      <DashboardSection title="At a glance" subtitle="Monthly activity (last 8 months)">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {ADMIN_METRICS.map(
            ({ label, statKey, trendKey, icon, to, sparkColor, valueClass }) => (
              <MetricTile
                key={label}
                label={label}
                icon={icon}
                value={stats?.[statKey] ?? 0}
                valueClassName={valueClass}
                to={to}
                sparkline={
                  trendKey
                    ? pickActivityTrend(stats?.activity_trend, trendKey)
                    : undefined
                }
                sparklineColor={sparkColor}
              />
            )
          )}
        </div>
      </DashboardSection>

      <div className="grid gap-6 md:grid-cols-5">
        <section className="gre-dashboard-card md:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-ink">Submissions awaiting review</h2>
              <p className="text-sm text-slate-500">
                Authors submitted these for approval. Open to preview PDFs.
              </p>
            </div>
            <Link
              to="/dashboard/review"
              className="shrink-0 text-sm font-semibold text-brand-600 hover:underline"
            >
              Full queue
            </Link>
          </div>

          {pendingLoading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CheckCircle2}
                title="Queue is clear"
                description="New author submissions will appear here when they submit for review."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 8).map((pub) => (
                <li key={pub.id}>
                  <Link
                    to={`/dashboard/review?pub=${encodeURIComponent(pub.encoded_id?.trim() || String(pub.id))}`}
                    className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-600">
                        {authorDisplayName(pub.author)}
                      </p>
                      <p className="font-semibold text-ink">
                        {formatGrePaperTitle(pub.title, pub.short_number)}
                      </p>
                      {pub.sub_category_name && (
                        <span className="mt-1 inline-block text-xs text-slate-500">
                          {pub.sub_category_name}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={pub.status} />
                      <span className="text-[10px] font-bold uppercase text-brand-600">
                        Review
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="gre-dashboard-card md:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-ink">Quick actions</h2>
            <p className="text-sm text-slate-500">Common admin tasks in one place.</p>
          </div>
          <div className="grid gap-2 p-3">
            {QUICK_LINKS.map(({ to, label, description, icon }) => (
              <QuickLinkTile
                key={to}
                to={to}
                label={label}
                description={description}
                icon={icon}
                value={to === "/dashboard/review" && pendingCount > 0 ? pendingCount : undefined}
                highlight={to === "/dashboard/review" && pendingCount > 0}
              />
            ))}
          </div>
        </section>
      </div>

      {revisions.length > 0 && (
        <section className="gre-dashboard-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Awaiting author resubmission</h2>
              <p className="mt-1 text-sm text-slate-500">
                {revisions.length} publication{revisions.length !== 1 ? "s" : ""} sent back for
                revision.
              </p>
            </div>
            <Link
              to="/dashboard/review?status=2"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View revision queue
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
