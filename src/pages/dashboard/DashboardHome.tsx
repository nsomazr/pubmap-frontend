import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Map,
  MessageSquare,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { GreHeroBanner } from "../../components/ui/GreHeroBanner";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  greStatCardDraft,
  greStatCardPending,
  greStatCardPublished,
  greStatCardRevision,
  greStatIconDraft,
  greStatIconPending,
  greStatIconPublished,
  greStatIconRevision,
  greStatLinkPending,
} from "../../lib/greTheme";
import { userFirstName } from "../../lib/userDisplay";
import { canAccessReviewQueue, isPlatformAdmin } from "../../lib/userAccess";
import type { DashboardStats } from "../../types";

export function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);
  const canReview = canAccessReviewQueue(user);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats/");
      return data;
    },
  });

  const cards = [
    {
      label: "Drafts",
      value: stats?.drafts ?? 0,
      icon: FileText,
      to: "/dashboard/publications?status=0",
      gradient: greStatCardDraft,
      iconBg: greStatIconDraft,
    },
    {
      label: "Pending review",
      value: stats?.pending ?? 0,
      icon: Clock,
      to: "/dashboard/publications?status=1",
      gradient: greStatCardPending,
      iconBg: greStatIconPending,
    },
    {
      label: "Needs revision",
      value: stats?.commented ?? 0,
      icon: MessageSquare,
      to: "/dashboard/publications?status=2",
      gradient: greStatCardRevision,
      iconBg: greStatIconRevision,
    },
    {
      label: "Published",
      value: stats?.published ?? 0,
      icon: CheckCircle,
      to: "/dashboard/publications?status=3",
      gradient: greStatCardPublished,
      iconBg: greStatIconPublished,
    },
  ];

  const total =
    (stats?.drafts ?? 0) +
    (stats?.pending ?? 0) +
    (stats?.commented ?? 0) +
    (stats?.published ?? 0);

  const greetingName = userFirstName(user);
  const initials =
    `${user?.firstname?.[0] || ""}${user?.lastname?.[0] || ""}`.toUpperCase() || "?";

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Track your research pipeline from draft to global visibility."
      />

      <GreHeroBanner
        className="mb-8"
        photoUrl={user?.photo}
        initials={initials}
        title={
          <span>
            Welcome back, {greetingName}
          </span>
        }
        subtitle={
          <div>
            <div className="flex items-center gap-2 text-slate-500">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium">Your research footprint</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {total} publication{total !== 1 ? "s" : ""}
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              {stats?.published
                ? `${stats.published} live on the world map. Keep sharing knowledge.`
                : "Submit your first publication to appear on the global research map."}
            </p>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/publications/new"
              className="gre-interactive inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              New publication
            </Link>
            <Link
              to="/"
              className="gre-interactive inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-200"
            >
              <Map className="h-4 w-4 text-brand-600" />
              View map
            </Link>
            {(isAdmin || canReview) && (stats?.pending ?? 0) > 0 && (
              <Link
                to="/dashboard/review"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${greStatLinkPending}`}
              >
                <Clock className="h-4 w-4" />
                {stats?.pending} pending review
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 gre-stagger">
        {cards.map(({ label, value, icon: Icon, to, gradient, iconBg }) => (
          <Link
            key={label}
            to={to}
            className={`gre-card gre-card-hover group relative overflow-hidden bg-gradient-to-br ${gradient} p-5`}
          >
            <div className={`inline-flex rounded-xl p-2.5 ${iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</p>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
            <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
