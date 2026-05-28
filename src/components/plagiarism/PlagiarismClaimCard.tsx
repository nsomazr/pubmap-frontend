import { useMutation } from "@tanstack/react-query";
import { ChevronDown, FileWarning, Link2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import {
  CLAIM_STATUS_LABELS,
  resolvePlagiarismClaim,
  type PlagiarismClaim,
  type PlagiarismDecision,
} from "../../lib/plagiarism";
import { buildDashboardPublicationPath } from "../../lib/publicationPaths";
import type { PlagiarismClaimStatus } from "../../types";
import { ClaimReviewPanel } from "./ClaimReviewPanel";
import { formatClaimDate } from "./claimPreviewUtils";

const STATUS_STYLES: Record<PlagiarismClaimStatus, string> = {
  open: "bg-amber-50 text-amber-900 ring-amber-200/90",
  revision: "bg-sky-50 text-sky-900 ring-sky-200/90",
  dismissed: "bg-slate-100 text-slate-700 ring-slate-200/90",
  restored: "bg-emerald-50 text-emerald-900 ring-emerald-200/90",
  hidden: "bg-slate-100 text-slate-700 ring-slate-200/90",
  deleted: "bg-red-50 text-red-900 ring-red-200/90",
};

function ClaimStatusBadge({ status }: { status: PlagiarismClaimStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {CLAIM_STATUS_LABELS[status] ?? status}
    </span>
  );
}

type Props = {
  claim: PlagiarismClaim;
  adminView?: boolean;
  onResolved?: () => void;
  defaultPreviewOpen?: boolean;
};

export function PlagiarismClaimCard({
  claim,
  adminView,
  onResolved,
  defaultPreviewOpen = true,
}: Props) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(defaultPreviewOpen);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: (decision: PlagiarismDecision) =>
      resolvePlagiarismClaim(claim.id, decision, notes.trim() || undefined),
    onSuccess: () => onResolved?.(),
    onError: () => setError("Could not apply this decision."),
  });

  const description = claim.description?.trim() || "";
  const longDescription = description.length > 280;
  const publicationHref =
    claim.publication_status === 3
      ? buildDashboardPublicationPath(
          claim.publication_id,
          claim.publication_encoded_id,
          { suffix: "reader" }
        )
      : buildDashboardPublicationPath(
          claim.publication_id,
          claim.publication_encoded_id
        );

  return (
    <article className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start gap-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <FileWarning className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                #{claim.id}
              </span>
              <ClaimStatusBadge status={claim.status} />
            </div>
            <Link
              to={publicationHref}
              className="mt-1 block text-base font-semibold leading-snug text-ink hover:text-brand-800 sm:text-[1.05rem]"
            >
              {claim.publication_title}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              Filed {formatClaimDate(claim.created_at)}
              {claim.reporter_name && adminView ? ` · ${claim.reporter_name}` : ""}
            </p>
          </div>
        </div>
        <Link
          to={publicationHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
        >
          <Link2 className="h-3.5 w-3.5" />
          Open publication
        </Link>
      </div>

      {description && (
        <div className="mt-4">
          <p
            className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-700 ${
              !descriptionExpanded && longDescription ? "line-clamp-4" : ""
            }`}
          >
            {description}
          </p>
          {longDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              {descriptionExpanded ? "Show less" : "Read full report"}
            </button>
          )}
        </div>
      )}

      {(claim.evidence.length > 0 || claim.publication_id) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="gre-interactive inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-expanded={previewOpen}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${previewOpen ? "rotate-180" : ""}`}
            />
            {previewOpen ? "Hide materials" : "Preview evidence & publication"}
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              previewOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              {previewOpen && (
                <ClaimReviewPanel
                  publicationId={claim.publication_id}
                  evidence={claim.evidence}
                  publicationTitle={claim.publication_title}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {claim.admin_notes && claim.status !== "open" && (
        <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">GRE notes · </span>
          {claim.admin_notes}
        </p>
      )}

      {adminView && claim.status === "open" && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
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
            to={buildDashboardPublicationPath(
              claim.publication_id,
              claim.publication_encoded_id,
              { query: "focus=claims" }
            )}
            className="inline-block text-xs font-semibold text-brand-700 hover:underline"
          >
            Open publication in dashboard
          </Link>
        </div>
      )}
    </article>
  );
}
