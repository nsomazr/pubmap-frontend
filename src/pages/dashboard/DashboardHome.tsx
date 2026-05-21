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
import { userFirstName } from "../../lib/userDisplay";
import type { DashboardStats } from "../../types";

export function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;

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
      gradient: "from-slate-500/10 to-slate-500/5",
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      label: "Pending review",
      value: stats?.pending ?? 0,
      icon: Clock,
      to: "/dashboard/publications?status=1",
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-100 text-amber-700",
    },
    {
      label: "Needs revision",
      value: stats?.commented ?? 0,
      icon: MessageSquare,
      to: "/dashboard/publications?status=2",
      gradient: "from-orange-500/10 to-orange-500/5",
      iconBg: "bg-orange-100 text-orange-700",
    },
    {
      label: "Published",
      value: stats?.published ?? 0,
      icon: CheckCircle,
      to: "/dashboard/publications?status=3",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-100 text-emerald-700",
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              New publication
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200"
            >
              <Map className="h-4 w-4 text-brand-600" />
              View map
            </Link>
            {isAdmin && (stats?.pending ?? 0) > 0 && (
              <Link
                to="/dashboard/review"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
              >
                <Clock className="h-4 w-4" />
                {stats?.pending} pending review
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to, gradient, iconBg }) => (
          <Link
            key={label}
            to={to}
            className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br ${gradient} p-5 transition hover:border-brand-200 hover:shadow-md`}
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
