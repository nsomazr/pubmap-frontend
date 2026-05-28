import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileWarning, Shield } from "lucide-react";
import { useState } from "react";
import { PlagiarismClaimCard } from "../../components/plagiarism/PlagiarismClaimCard";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { fetchPlagiarismStats, type PlagiarismClaim } from "../../lib/plagiarism";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../../lib/pagination";

export function PlagiarismClaimsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const [tab, setTab] = useState<"mine" | "moderation" | "publisher">(
    isAdmin ? "moderation" : "publisher"
  );
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const selectTab = (next: typeof tab) => {
    setTab(next);
    setPage(1);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["plagiarism-claims"] });
    queryClient.invalidateQueries({ queryKey: ["plagiarism-stats"] });
  };

  const listParams =
    tab === "moderation"
      ? { status: "open" as const }
      : tab === "publisher"
        ? { scope: "owned" as const }
        : {};

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["plagiarism-claims", tab, page],
    queryFn: async () => {
      const { data } = await api.get("/plagiarism-claims/", {
        params: { ...listParams, page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<PlagiarismClaim>(data as PlagiarismClaim[] | Paginated<PlagiarismClaim>);
    },
    enabled: isAdmin ? tab === "moderation" || tab === "mine" : true,
  });

  const claims = claimsData?.results ?? [];
  const claimsTotal = claimsData?.count ?? 0;

  const { data: stats } = useQuery({
    queryKey: ["plagiarism-stats"],
    queryFn: fetchPlagiarismStats,
    enabled: isAdmin,
  });

  const emptyCopy =
    tab === "moderation"
      ? {
          title: "No open plagiarism claims",
          description: "New reports from the community will appear in this queue.",
        }
      : tab === "publisher"
        ? {
            title: "No claims on your publications",
            description: "If GRE asks you to address a claim, it will appear here.",
          }
        : {
            title: "No reports yet",
            description:
              'Use "Report plagiarism concern" on a publication page to flag a study.',
          };

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Plagiarism reports"
        description="Review filed concerns, inspect evidence, and compare against the publication PDF."
      />

      {isAdmin && stats && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open</p>
              <p className="text-2xl font-bold text-ink">{stats.open}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resolved
              </p>
              <p className="text-2xl font-bold text-ink">{stats.resolved}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/90 p-1.5 ring-1 ring-slate-200/70">
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => selectTab("moderation")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === "moderation" ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Moderation queue
            </button>
            <button
              type="button"
              onClick={() => selectTab("mine")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === "mine" ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My reports
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => selectTab("publisher")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === "publisher" ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Claims on my publications
            </button>
            <button
              type="button"
              onClick={() => selectTab("mine")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === "mine" ? "gre-meet-tab--active" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reports I filed
            </button>
          </>
        )}
      </div>

      {claimsLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <FileWarning className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-ink">{emptyCopy.title}</p>
          <p className="mt-1 text-sm text-slate-500">{emptyCopy.description}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <li key={claim.id}>
                  <PlagiarismClaimCard
                    claim={claim}
                    adminView={tab === "moderation" && isAdmin}
                    onResolved={invalidate}
                    defaultPreviewOpen={claims.length === 1}
                  />
                </li>
              ))}
            </ul>
          </div>
          <Pagination
            page={page}
            totalCount={claimsTotal}
            onPageChange={setPage}
            itemLabel="claims"
            className="mt-6"
          />
        </>
      )}
    </div>
  );
}
