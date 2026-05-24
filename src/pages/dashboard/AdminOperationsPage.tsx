import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
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
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { GRE_ADMIN_QUICK_LINK_COLORS, greUrgentIcon, greUrgentRing } from "../../lib/greTheme";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { authorDisplayName } from "../../lib/userDisplay";
import type { DashboardStats, Publication } from "../../types";

const QUICK_LINKS = [
  {
    to: "/dashboard/review",
    label: "Review queue",
    description: "Approve PDFs or request revisions",
    icon: ClipboardCheck,
  },
  {
    to: "/dashboard/plagiarism",
    label: "Plagiarism moderation",
    description: "Review claims, evidence, and restore or remove studies",
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
    label: "Categories",
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

  const statCards = [
    {
      label: "Pending review",
      value: stats?.pending ?? 0,
      icon: Clock,
      to: "/dashboard/review",
      urgent: (stats?.pending ?? 0) > 0,
    },
    {
      label: "Needs revision",
      value: stats?.commented ?? 0,
      icon: MessageSquareWarning,
      to: "/dashboard/review?status=2",
      urgent: false,
    },
    {
      label: "Published on map",
      value: stats?.published ?? 0,
      icon: CheckCircle2,
      to: "/dashboard/publications?status=3",
      urgent: false,
    },
    {
      label: "Active authors",
      value: stats?.authors ?? 0,
      icon: Users,
      to: "/dashboard/authors",
      urgent: false,
    },
    {
      label: "Drafts (all users)",
      value: stats?.drafts ?? 0,
      icon: FileText,
      to: "/dashboard/publications?status=0",
      urgent: false,
    },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Admin operations"
        description="Platform oversight: review submissions, manage users, and keep GRE running smoothly."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ label, value, icon: Icon, to, urgent }) => (
          <Link
            key={label}
            to={to}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
              urgent ? greUrgentRing : "border-slate-100 hover:border-brand-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  urgent ? greUrgentIcon : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-ink">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="gre-card lg:col-span-3">
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
                    to={`/dashboard/review?pub=${pub.id}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-brand-50/40"
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

        <section className="gre-card lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-ink">Quick actions</h2>
            <p className="text-sm text-slate-500">Common admin tasks in one place.</p>
          </div>
          <ul className="divide-y divide-slate-100 p-2">
            {QUICK_LINKS.map(({ to, label, description, icon: Icon }, index) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${GRE_ADMIN_QUICK_LINK_COLORS[index % GRE_ADMIN_QUICK_LINK_COLORS.length]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {revisions.length > 0 && (
        <section className="gre-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Awaiting author resubmission</h2>
              <p className="mt-1 text-sm text-slate-500">
                {revisions.length} publication{revisions.length !== 1 ? "s" : ""} sent back for
                revision. Authors must update and resubmit.
              </p>
            </div>
            <Link
              to="/dashboard/review?status=2"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-200"
            >
              View revision queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
