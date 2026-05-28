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
import { InfoBanner } from "../../components/dashboard/InfoBanner";
import { MetricTile } from "../../components/dashboard/MetricTile";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { QuickLinkTile } from "../../components/dashboard/QuickLinkTile";
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

const WORKFLOW_METRICS = [
  {
    id: "drafts",
    label: "Drafts",
    hint: "Finish and submit",
    icon: FileText,
    status: "0",
    statKey: "drafts" as const,
    colors: greAccountStatDraft,
    sparkColor: "#64748b",
  },
  {
    id: "pending",
    label: "Pending review",
    hint: "Awaiting GRE approval",
    icon: Clock,
    status: "1",
    statKey: "pending" as const,
    colors: greAccountStatPending,
    sparkColor: "#7c3aed",
  },
  {
    id: "revision",
    label: "Needs revision",
    hint: "Address feedback",
    icon: MessageSquare,
    status: "2",
    statKey: "commented" as const,
    colors: greAccountStatRevision,
    sparkColor: "#d97706",
  },
  {
    id: "published",
    label: "Published",
    hint: "Live on the map",
    icon: CheckCircle,
    status: "3",
    statKey: "published" as const,
    colors: greAccountStatPublished,
    sparkColor: "#0d9488",
  },
] as const;

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

/** Smooth ramp to current count for metric sparklines (visual only). */
function sparkFromCount(count: number): number[] {
  const steps = 8;
  if (count <= 0) return Array(steps).fill(0);
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    const wave = 0.92 + 0.08 * Math.sin(i * 1.1);
    out.push(Math.max(0, Math.round(count * t * wave)));
  }
  out[steps - 1] = count;
  return out;
}

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
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Overview"
        description="Your publications, workflow status, and shortcuts across GRE."
      />

      <section className="gre-dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <UserAvatar
              user={user}
              name={displayName}
              size="lg"
              className="!h-14 !w-14 shrink-0 !rounded-xl !text-base sm:!h-16 sm:!w-16"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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

        {nextStep && (
          <Link
            to={nextStep.to}
            className={`gre-interactive flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold sm:px-5 ${
              nextStep.tone === "amber"
                ? "bg-amber-50 text-amber-900 hover:bg-amber-100/80"
                : nextStep.tone === "violet"
                  ? "bg-violet-50 text-violet-900 hover:bg-violet-100/80"
                  : "bg-brand-50 text-brand-900 hover:bg-brand-100/80"
            }`}
          >
            <span>{nextStep.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
          </Link>
        )}

        <div className="border-t border-slate-100 p-4 sm:p-5">
          <InfoBanner
            storageKey="gre-dashboard-map-tip-v1"
            action={
              <Link
                to="/"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open map
              </Link>
            }
          >
            Published papers appear on the research map. Use <strong>Map layers</strong> to
            explore density, basemaps, and clusters.
          </InfoBanner>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Workflow
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW_METRICS.map(
            ({ id, label, hint, icon, status, statKey, colors, sparkColor }) => {
              const value = stats?.[statKey] ?? 0;
              return (
                <MetricTile
                  key={id}
                  label={label}
                  hint={hint}
                  icon={icon}
                  value={value}
                  loading={isLoading}
                  valueClassName={colors.color}
                  to={`/dashboard/publications?status=${status}`}
                  sparkline={sparkFromCount(value)}
                  sparklineColor={sparkColor}
                />
              );
            }
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Quick access
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ to, label, description, icon }) => (
            <QuickLinkTile
              key={to}
              to={to}
              label={label}
              description={description}
              icon={icon}
            />
          ))}
          {(isAdmin || canReview) && pending > 0 && (
            <QuickLinkTile
              to="/dashboard/review"
              label="Review queue"
              description="Pending for approval"
              icon={Clock}
              value={pending}
              highlight
            />
          )}
        </div>
      </section>
    </div>
  );
}
