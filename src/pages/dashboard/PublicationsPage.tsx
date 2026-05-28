import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Plus, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardPublicationRow } from "../../components/dashboard/DashboardPublicationRow";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";
import { usePageParam } from "../../hooks/usePageParam";
import api from "../../lib/api";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../../lib/pagination";
import { canAccessReviewQueue, isPlatformAdmin } from "../../lib/userAccess";
import type { Publication } from "../../types";

const TABS = [
  { value: "5", label: "All" },
  { value: "0", label: "Draft" },
  { value: "1", label: "Pending" },
  { value: "2", label: "Revision" },
  { value: "3", label: "Published" },
  { value: "4", label: "Archived" },
] as const;

const ADMIN_TABS = [{ value: "6", label: "Deleted" }] as const;

const EMPTY_COPY: Record<string, { title: string; description: string }> = {
  "5": {
    title: "No publications yet",
    description:
      "Start a new submission to share your research on the global map. You can save drafts and submit when ready for review.",
  },
  "0": {
    title: "No draft publications",
    description: "Save work in progress here before sending it to the review queue.",
  },
  "1": {
    title: "Nothing pending review",
    description: "Submitted publications waiting for admin approval will show up here.",
  },
  "2": {
    title: "No revision publications",
    description:
      "When an admin requests changes, open the publication, address feedback, and resubmit for review.",
  },
  "3": {
    title: "No published publications",
    description: "Approved studies appear on the public map and publication pages.",
  },
  "4": {
    title: "No archived publications",
    description: "Archived studies are hidden from the map but can be restored anytime.",
  },
  "6": {
    title: "No deleted publications",
    description: "Soft-deleted studies appear here for admin recovery.",
  },
};

const NEXT_STEP: Record<number, string> = {
  0: "Add a map location, then submit for review.",
  1: "Waiting for admin approval.",
  2: "Address feedback and resubmit for review.",
  3: "Live on the research map.",
  4: "Archived — restore to edit or republish.",
  6: "Deleted — admin can restore.",
};

function publicationHref(
  pub: Publication,
  options: { reviewPending: boolean; needsClaim: boolean }
) {
  const { reviewPending, needsClaim } = options;
  if (reviewPending) return `/dashboard/review?pub=${pub.id}`;
  if (pub.status === 3) return `/dashboard/publications/${pub.id}/reader`;
  if (needsClaim) return `/dashboard/publications/${pub.id}?focus=claims`;
  if (pub.status === 2) return `/dashboard/publications/${pub.id}?focus=feedback`;
  return `/dashboard/publications/${pub.id}`;
}

export function PublicationsPage() {
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);
  const canReview = canAccessReviewQueue(user);
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "5";
  const { page, setPage } = usePageParam([status, isAdmin]);

  const tabs = isAdmin ? [...TABS, ...ADMIN_TABS] : [...TABS];

  const { data: listData, isLoading } = useQuery({
    queryKey: ["publications", status, isAdmin, page],
    queryFn: async () => {
      const { data } = await api.get("/publications/", {
        params: { status, page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<Publication>(data as Publication[] | Paginated<Publication>);
    },
  });

  const publications = listData?.results ?? [];
  const listTotal = listData?.count ?? 0;

  const { data: counts } = useQuery({
    queryKey: ["publication-tab-counts", isAdmin],
    queryFn: async () => {
      const entries = await Promise.all(
        tabs.map(async (tab) => {
          const { data } = await api.get("/publications/", {
            params: { status: tab.value, page: 1, page_size: 1 },
          });
          const paginated = unwrapPaginated<Publication>(
            data as Publication[] | Paginated<Publication>
          );
          return [tab.value, paginated.count] as const;
        })
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const empty = EMPTY_COPY[status] ?? EMPTY_COPY["5"];
  const totalCount = counts?.["5"] ?? publications.length;
  const publishedCount = counts?.["3"] ?? 0;
  const pendingCount = counts?.["1"] ?? 0;
  const revisionCount = counts?.["2"] ?? 0;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Publications"
        description="Manage drafts, track review status, and open papers on the GRE map."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canReview && (
              <Link
                to="/dashboard/review"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25"
              >
                <Clock className="h-4 w-4" />
                Review queue
                {(counts?.["1"] ?? 0) > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {counts?.["1"]}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/dashboard/publications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-md transition hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" />
              New publication
            </Link>
          </div>
        }
      />

      {counts && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 px-4 py-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Published</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-900">{publishedCount}</p>
          </div>
          <div className="rounded-2xl border border-violet-200/80 bg-violet-50/40 px-4 py-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-800">Pending</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-violet-900">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Revision</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-950">{revisionCount}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-3 sm:px-4">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
            {tabs.map((tab) => {
              const active = status === tab.value;
              const count = counts?.[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setParams(tab.value === "5" ? {} : { status: tab.value })}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/90"
                      : "text-slate-600 hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  {tab.label}
                  {count !== undefined && (
                    <span
                      className={`ml-1.5 tabular-nums text-xs font-bold ${
                        active ? "text-brand-600" : "text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {canReview && status === "1" && (counts?.["1"] ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 bg-violet-50/60 px-4 py-3 sm:px-5">
            <p className="text-sm text-violet-900">
              <span className="font-semibold">{counts?.["1"]}</span> paper
              {counts?.["1"] === 1 ? "" : "s"} waiting in the review queue.
            </p>
            <Link
              to="/dashboard/review"
              className="text-sm font-semibold text-violet-800 underline-offset-2 hover:underline"
            >
              Open review queue
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 px-4 py-5 sm:px-5">
                <div className="gre-skeleton h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="gre-skeleton h-4 w-32 rounded" />
                  <div className="gre-skeleton h-5 w-full max-w-md rounded" />
                  <div className="gre-skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : publications.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={status === "3" ? MapPin : Sparkles}
              title={empty.title}
              description={empty.description}
              action={
                status === "5" || status === "0" ? (
                  <Link
                    to="/dashboard/publications/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create publication
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="gre-stagger divide-y divide-slate-100">
            {publications.map((pub) => {
              const reviewPending = canReview && pub.status === 1;
              const hasDoc = (pub.documents?.length ?? 0) > 0;
              const claimSummary = pub.plagiarism_summary;
              const needsClaim = Boolean(claimSummary?.needs_author_action);
              const workflowHint = needsClaim
                ? "Address plagiarism claims and resubmit."
                : claimSummary?.open_count
                  ? `${claimSummary.open_count} plagiarism claim${claimSummary.open_count === 1 ? "" : "s"} under review.`
                  : NEXT_STEP[pub.status] ?? "";

              return (
                <DashboardPublicationRow
                  key={pub.id}
                  pub={pub}
                  href={publicationHref(pub, { reviewPending, needsClaim })}
                  workflowHint={workflowHint}
                  reviewPending={reviewPending}
                  hasDoc={hasDoc}
                  showClaim={Boolean(claimSummary?.open_count || needsClaim)}
                />
              );
            })}
          </div>
        )}
      </div>

      {!isLoading && listTotal > 0 && (
        <Pagination
          page={page}
          totalCount={listTotal}
          onPageChange={setPage}
          itemLabel={activeTabLabel(status)}
          className="pt-2"
        />
      )}
    </div>
  );
}

function activeTabLabel(status: string): string {
  const labels: Record<string, string> = {
    "5": "publications",
    "0": "drafts",
    "1": "pending items",
    "2": "revisions",
    "3": "published papers",
    "4": "archived papers",
    "6": "deleted papers",
  };
  return labels[status] ?? "items";
}
