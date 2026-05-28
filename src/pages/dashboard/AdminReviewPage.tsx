import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AdminPublicationReviewCard } from "../../components/publication/AdminPublicationReviewCard";
import { EmptyState } from "../../components/dashboard/EmptyState";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { usePageParam } from "../../hooks/usePageParam";
import api from "../../lib/api";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../../lib/pagination";
import { canAccessReviewQueue } from "../../lib/userAccess";
import type { Publication } from "../../types";

const TABS = [
  { value: "1", label: "Pending review" },
  { value: "2", label: "Needs revision" },
] as const;

export function AdminReviewPage() {
  const { user } = useAuth();
  if (!canAccessReviewQueue(user)) return <Navigate to="/dashboard" replace />;

  const [params, setParams] = useSearchParams({ status: "1" });
  const status = params.get("status") ?? "1";
  const focusPubId = params.get("pub");
  const { page, setPage } = usePageParam([status]);

  const { data: listData, isLoading } = useQuery({
    queryKey: ["admin-review", status, page],
    queryFn: async () => {
      const { data } = await api.get("/publications/", {
        params: { status, page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<Publication>(data as Publication[] | Paginated<Publication>);
    },
  });

  const publications = listData?.results ?? [];
  const totalCount = listData?.count ?? 0;

  const activeTab = TABS.find((t) => t.value === status) ?? TABS[0];

  useEffect(() => {
    if (!focusPubId || isLoading) return;
    const el = document.getElementById(`review-pub-${focusPubId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusPubId, isLoading, publications.length]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Review queue" />

      <div className="mb-8 inline-flex rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setParams({ status: tab.value })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              status === tab.value
                ? "bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : publications.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={`No ${activeTab.label.toLowerCase()}`}
          description="New PDF submissions from authors will appear here for your review."
        />
      ) : (
        <div className="space-y-6">
          {publications.map((pub) => (
            <div
              key={pub.id}
              id={`review-pub-${pub.id}`}
              className={
                focusPubId === String(pub.id)
                  ? "scroll-mt-6 rounded-2xl ring-2 ring-brand-400 ring-offset-2 transition-shadow"
                  : "scroll-mt-6"
              }
            >
              <AdminPublicationReviewCard pub={pub} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && totalCount > 0 && (
        <Pagination
          page={page}
          totalCount={totalCount}
          onPageChange={setPage}
          itemLabel="submissions"
          className="mt-8"
        />
      )}
    </div>
  );
}
