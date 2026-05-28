import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Map,
  MessageSquare,
  Plus,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { userFirstName, userFormalName } from "../../lib/userDisplay";
import {
  greAccountStatDraft,
  greAccountStatPending,
  greAccountStatPublished,
  greAccountStatRevision,
} from "../../lib/greTheme";
import { canAccessReviewQueue, isPlatformAdmin } from "../../lib/userAccess";
import type { DashboardStats } from "../../types";

const STATUS_BORDER: Record<string, string> = {
  drafts: "border-l-slate-400",
  pending: "border-l-violet-400",
  revision: "border-l-amber-400",
  published: "border-l-teal-500",
};

const WORKFLOW_CARDS = [
  {
    id: "drafts",
    label: "Drafts",
    hint: "Finish and submit",
    icon: FileText,
    status: "0",
    statKey: "drafts" as const,
    colors: greAccountStatDraft,
    iconClass: "bg-slate-100 text-slate-600",
  },
  {
    id: "pending",
    label: "Pending review",
    hint: "Awaiting GRE approval",
    icon: Clock,
    status: "1",
    statKey: "pending" as const,
    colors: greAccountStatPending,
    iconClass: "bg-violet-50 text-violet-700",
  },
  {
    id: "revision",
    label: "Needs revision",
    hint: "Address feedback",
    icon: MessageSquare,
    status: "2",
    statKey: "commented" as const,
    colors: greAccountStatRevision,
    iconClass: "bg-amber-50 text-amber-800",
  },
  {
    id: "published",
    label: "Published",
    hint: "Live on the map",
    icon: CheckCircle,
    status: "3",
    statKey: "published" as const,
    colors: greAccountStatPublished,
    iconClass: "bg-teal-50 text-teal-700",
  },
];

const QUICK_LINKS = [
  {
    to: "/dashboard/publications",
    label: "Publications",
    description: "Drafts, review, and published papers",
    icon: FileText,
  },
  {
    to: "/dashboard/messages",
    label: "Messages",
    description: "Connect with researchers",
    icon: Mail,
  },
  {
    to: "/dashboard/meetings",
    label: "GRE Meet",
    description: "Host or join research sessions",
    icon: Calendar,
  },
  {
    to: "/dashboard/account",
    label: "Account",
    description: "Profile and security",
    icon: User,
  },
] as const;

export function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);
  const canReview = canAccessReviewQueue(user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats/");
      return data;
    },
  });

  const greetingName = userFirstName(user);
  const displayName = userFormalName(user) || greetingName;

  const total =
    (stats?.drafts ?? 0) +
    (stats?.pending ?? 0) +
    (stats?.commented ?? 0) +
    (stats?.published ?? 0);

  const published = stats?.published ?? 0;
  const pending = stats?.pending ?? 0;
  const revision = stats?.commented ?? 0;

  const nextStep =
    revision > 0
      ? {
          label: `${revision} publication${revision === 1 ? "" : "s"} need revision`,
          to: "/dashboard/publications?status=2",
          tone: "amber" as const,
        }
      : pending > 0 && (isAdmin || canReview)
        ? {
            label: `${pending} awaiting your review`,
            to: "/dashboard/review",
            tone: "violet" as const,
          }
        : pending > 0
          ? {
              label: `${pending} submitted for review`,
              to: "/dashboard/publications?status=1",
              tone: "brand" as const,
            }
          : total === 0
            ? {
                label: "Start your first publication",
                to: "/dashboard/publications/new",
                tone: "brand" as const,
              }
            : null;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Overview"
        description="Your publications, workflow status, and shortcuts across GRE."
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/50 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <UserAvatar
                user={user}
                name={displayName}
                size="lg"
                className="!h-14 !w-14 shrink-0 !rounded-xl !text-base sm:!h-16 sm:!w-16"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Welcome back
                </p>
                <h2 className="text-lg font-bold text-ink sm:text-xl">{greetingName}</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {isLoading ? (
                    "Loading your stats…"
                  ) : (
                    <>
                      <span className="font-semibold text-ink">{total}</span> publication
                      {total !== 1 ? "s" : ""}
                      {published > 0 && (
                        <>
                          {" "}
                          · <span className="text-teal-700">{published} on the map</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link to="/dashboard/publications/new">
                <Button className="!px-3.5 !py-2 text-sm">
                  <Plus className="h-4 w-4" />
                  New publication
                </Button>
              </Link>
              <Link to="/">
                <Button variant="secondary" className="!px-3.5 !py-2 text-sm">
                  <Map className="h-4 w-4" />
                  View map
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {nextStep && (
          <Link
            to={nextStep.to}
            className={`gre-interactive flex items-center justify-between gap-3 border-b px-4 py-3 text-sm font-semibold sm:px-5 ${
              nextStep.tone === "amber"
                ? "border-amber-100 bg-amber-50/80 text-amber-900 hover:bg-amber-50"
                : nextStep.tone === "violet"
                  ? "border-violet-100 bg-violet-50/80 text-violet-900 hover:bg-violet-50"
                  : "border-brand-100 bg-brand-50/60 text-brand-900 hover:bg-brand-50"
            }`}
          >
            <span>{nextStep.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
          </Link>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_CARDS.map(({ id, label, hint, icon: Icon, status, statKey, colors, iconClass }) => {
            const value = stats?.[statKey] ?? 0;
            return (
              <Link
                key={id}
                to={`/dashboard/publications?status=${status}`}
                className={`gre-interactive group flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:py-5 border-l-4 ${STATUS_BORDER[id]} hover:bg-slate-50/60`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-2xl font-bold tabular-nums leading-none ${colors.color}`}>
                    {isLoading ? "—" : value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">{label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          Quick links
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ to, label, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="gre-interactive group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition hover:border-brand-200/80 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink group-hover:text-brand-800">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{description}</p>
              </div>
            </Link>
          ))}
          {(isAdmin || canReview) && pending > 0 && (
            <Link
              to="/dashboard/review"
              className="gre-interactive group flex items-start gap-3 rounded-xl border border-violet-200/80 bg-violet-50/40 px-4 py-3.5 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                <Clock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-violet-950">Review queue</p>
                <p className="mt-0.5 text-xs leading-snug text-violet-800/80">
                  {pending} pending for approval
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
