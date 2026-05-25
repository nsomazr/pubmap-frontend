import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  CLAIM_STATUS_LABELS,
  fetchPlagiarismStats,
  resolvePlagiarismClaim,
  type PlagiarismClaim,
  type PlagiarismDecision,
} from "../../lib/plagiarism";

function ClaimCard({
  claim,
  adminView,
  onResolved,
}: {
  claim: PlagiarismClaim;
  adminView?: boolean;
  onResolved?: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const resolveMutation = useMutation({
    mutationFn: (decision: PlagiarismDecision) =>
      resolvePlagiarismClaim(claim.id, decision, notes.trim() || undefined),
    onSuccess: () => onResolved?.(),
    onError: () => setError("Could not apply this decision."),
  });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Claim #{claim.id}
          </p>
          <h3 className="mt-1 font-semibold text-ink">{claim.publication_title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Filed {new Date(claim.created_at).toLocaleString()}
            {claim.reporter_name && adminView ? ` · by ${claim.reporter_name}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            claim.status === "open"
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          {CLAIM_STATUS_LABELS[claim.status] ?? claim.status}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {claim.description}
      </p>

      {claim.evidence.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
          <ul className="mt-2 space-y-1">
            {claim.evidence.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                >
                  {item.label || "Attachment"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {claim.admin_notes && claim.status !== "open" && (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-semibold">Admin notes: </span>
          {claim.admin_notes}
        </p>
      )}

      {adminView && claim.status === "open" && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <Textarea
            label="Admin notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes for the author or internal record…"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate("hide")}
            >
              Hide
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate("address_claims")}
            >
              Address claims
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate("dismiss")}
            >
              Dismiss claim
            </Button>
            <Button
              type="button"
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate("delete")}
            >
              Remove publication
            </Button>
          </div>
          <Link
            to={`/dashboard/publications/${claim.publication_id}?focus=claims`}
            className="inline-block text-xs font-semibold text-brand-700 hover:underline"
          >
            Open publication in dashboard
          </Link>
        </div>
      )}
    </article>
  );
}

export function PlagiarismClaimsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;
  const [tab, setTab] = useState<"mine" | "moderation" | "publisher">(
    isAdmin ? "moderation" : "publisher"
  );
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["plagiarism-claims"] });
    queryClient.invalidateQueries({ queryKey: ["plagiarism-stats"] });
  };

  const { data: myClaims = [], isLoading: mineLoading } = useQuery({
    queryKey: ["plagiarism-claims", "mine"],
    queryFn: async () => {
      const { data } = await api.get<PlagiarismClaim[] | { results: PlagiarismClaim[] }>(
        "/plagiarism-claims/"
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: publisherClaims = [], isLoading: publisherLoading } = useQuery({
    queryKey: ["plagiarism-claims", "publisher"],
    queryFn: async () => {
      const { data } = await api.get<PlagiarismClaim[] | { results: PlagiarismClaim[] }>(
        "/plagiarism-claims/",
        { params: { scope: "owned" } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: !isAdmin,
  });

  const { data: openClaims = [], isLoading: openLoading } = useQuery({
    queryKey: ["plagiarism-claims", "open"],
    queryFn: async () => {
      const { data } = await api.get<PlagiarismClaim[] | { results: PlagiarismClaim[] }>(
        "/plagiarism-claims/",
        { params: { status: "open" } }
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: isAdmin,
  });

  const { data: stats } = useQuery({
    queryKey: ["plagiarism-stats"],
    queryFn: fetchPlagiarismStats,
    enabled: isAdmin,
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Plagiarism reports"
        description={
          isAdmin
            ? "Review claims, inspect evidence, and hide, address, dismiss, or remove publications."
            : tab === "publisher"
              ? "Review claims and moderation requests related to your publications."
              : "Track plagiarism reports you have submitted to GRE."
        }
      />

      {isAdmin && stats && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="gre-card flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open</p>
              <p className="text-2xl font-bold text-ink">{stats.open}</p>
            </div>
          </div>
          <div className="gre-card flex items-center gap-4 p-5">
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
              onClick={() => setTab("moderation")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === "moderation" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Moderation queue
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === "mine" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"
              }`}
            >
              My reports
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setTab("publisher")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === "publisher" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Claims on my publications
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                tab === "mine" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Reports I filed
            </button>
          </>
        )}
      </div>

      {tab === "moderation" && isAdmin ? (
        openLoading ? (
          <p className="text-slate-500">Loading queue…</p>
        ) : openClaims.length === 0 ? (
          <div className="gre-card p-8 text-center text-sm text-slate-500">
            No open plagiarism claims.
          </div>
        ) : (
          <div className="grid gap-4">
            {openClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} adminView onResolved={invalidate} />
            ))}
          </div>
        )
      ) : tab === "publisher" && !isAdmin ? (
        publisherLoading ? (
          <p className="text-slate-500">Loading publication claims…</p>
        ) : publisherClaims.length === 0 ? (
          <div className="gre-card p-8 text-center">
            <p className="font-medium text-ink">No claims on your publications</p>
            <p className="mt-1 text-sm text-slate-500">
              If GRE asks you to address a plagiarism claim, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {publisherClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onResolved={invalidate} />
            ))}
          </div>
        )
      ) : mineLoading ? (
        <p className="text-slate-500">Loading your claims…</p>
      ) : myClaims.length === 0 ? (
        <div className="gre-card p-8 text-center">
          <p className="font-medium text-ink">No reports yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Use “Report plagiarism concern” on a publication page if you need to flag a study.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} onResolved={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
}
