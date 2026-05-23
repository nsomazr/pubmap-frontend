import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  FileText,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { GreHeroBannerStrip } from "../../components/ui/GreHeroBanner";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { authorDisplayName } from "../../lib/userDisplay";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { SubcategoryBadge } from "../../components/taxonomy/SubcategoryBadge";
import { SubcategoryVisual } from "../../components/taxonomy/SubcategoryVisual";
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
  0: "Add location on the map, then submit for review.",
  1: "Waiting for admin approval.",
  2: "Read admin notes, update your submission, and resubmit.",
  3: "Live on the research map.",
  4: "Archived. Restore to continue editing or republish.",
  6: "Deleted. Admin can restore to previous workflow state.",
};

export function PublicationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "5";

  const tabs = isAdmin ? [...TABS, ...ADMIN_TABS] : [...TABS];

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ["publications", status, isAdmin],
    queryFn: async (): Promise<Publication[]> => {
      const { data } = await api.get<Publication[] | { results: Publication[] }>(
        "/publications/",
        { params: { status } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["publication-tab-counts", isAdmin],
    queryFn: async () => {
      const entries = await Promise.all(
        tabs.map(async (tab) => {
          const { data } = await api.get<Publication[] | { results: Publication[] }>(
            "/publications/",
            { params: { status: tab.value } }
          );
          const list = Array.isArray(data) ? data : (data.results ?? []);
          return [tab.value, list.length] as const;
        })
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const activeTab = tabs.find((t) => t.value === status) ?? TABS[0];
  const empty = EMPTY_COPY[status] ?? EMPTY_COPY["5"];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Publications"
        description="Manage your research submissions through review and publication."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Link
                to="/dashboard/review"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                <Clock className="h-4 w-4" />
                Review queue
              </Link>
            )}
            <Link
              to="/dashboard/publications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              New publication
            </Link>
          </div>
        }
      />

      <div className="mb-2 flex flex-wrap gap-2 rounded-2xl bg-slate-100/90 p-1.5 ring-1 ring-slate-200/70">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setParams(tab.value === "5" ? {} : { status: tab.value })}
            className={`gre-interactive flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              status === tab.value
                ? "bg-white text-brand-600 shadow-md ring-1 ring-slate-200/90"
                : "text-slate-600 hover:bg-white/60 hover:text-ink"
            }`}
          >
            {tab.label}
            {counts && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  status === tab.value
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {counts[tab.value] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mb-8 text-xs text-slate-500">
        Workflow: Draft → submit → Pending → admin review → Published, or Revision with feedback.
        {isAdmin && status === "1" && (
          <>
            {" "}
            <Link to="/dashboard/review" className="font-semibold text-brand-600 hover:underline">
              Open review queue
            </Link>{" "}
            to preview PDFs and approve.
          </>
        )}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="gre-skeleton h-28" />
          ))}
        </div>
      ) : publications.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={empty.title}
          description={empty.description}
          action={
            <Link
              to="/dashboard/publications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Create your first publication
            </Link>
          }
        />
      ) : (
        <div className="gre-stagger grid gap-4">
          {publications.map((pub) => {
            const reviewPending = isAdmin && pub.status === 1;
            const hasDoc = (pub.documents?.length ?? 0) > 0;
            const subVisual = publicationSubcategoryVisual(pub);
            const target = reviewPending
              ? `/dashboard/review?pub=${pub.id}`
              : `/dashboard/publications/${pub.id}`;
            return (
            <Link
              key={pub.id}
              to={target}
              className="gre-card gre-card-hover group block overflow-hidden p-0"
            >
              <GreHeroBannerStrip
                icon={FileText}
                accentColor={subVisual?.accent_color}
              />
              <div className="flex items-start justify-between gap-4 p-5 pt-8">
                <div className="min-w-0 flex-1">
                    {authorDisplayName(pub.author) && (
                      <p className="text-sm font-medium text-slate-600">
                        {authorDisplayName(pub.author)}
                      </p>
                    )}
                    <h3 className="mt-0.5 text-base font-semibold text-ink group-hover:text-brand-700">
                      {pub.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                      {pub.abstract}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {subVisual && <SubcategoryBadge visual={subVisual} size="xs" />}
                      {pub.short_number && <span>#{pub.short_number}</span>}
                      {pub.coordinates?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-600" />
                          {pub.coordinates.location}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {NEXT_STEP[pub.status] ?? ""}
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={pub.status} />
                  {reviewPending && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                      {hasDoc ? "Review PDF" : "No file"}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-600" />
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
