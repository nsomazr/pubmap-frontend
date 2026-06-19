import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenText, CheckCircle2, Users, X } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../ui/Button";
import type { CoAuthorLinkSummary } from "../../types";

interface Props {
  summary: CoAuthorLinkSummary;
  profileUserId?: number;
  onUpdated?: (summary: CoAuthorLinkSummary) => void;
  onDone?: () => void;
  showDoneButton?: boolean;
  id?: string;
}

function confidenceLabel(score?: number): string | null {
  if (score == null) return null;
  if (score >= 98) return "Very strong name match";
  if (score >= 90) return "Strong name match";
  return "Likely name match";
}

export function CoAuthorLinkPanel({
  summary,
  profileUserId,
  onUpdated,
  onDone,
  showDoneButton = false,
  id,
}: Props) {
  const [data, setData] = useState(summary);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const linkedCount = data.linked_publication_count;
  const pending = data.pending_name_matches;
  const busy = claimingId != null || dismissingId != null;

  const handleClaim = async (collaboratorId: number) => {
    setError("");
    setClaimingId(collaboratorId);
    try {
      const { data: response } = await api.post<CoAuthorLinkSummary>(
        "/auth/me/coauthor-link/claim/",
        { collaborator_id: collaboratorId }
      );
      setData(response);
      onUpdated?.(response);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail || "Could not link this co-authorship.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleDismiss = async (collaboratorId: number) => {
    setError("");
    setDismissingId(collaboratorId);
    try {
      const { data: response } = await api.post<CoAuthorLinkSummary>(
        "/auth/me/coauthor-link/dismiss/",
        { collaborator_id: collaboratorId }
      );
      setData(response);
      onUpdated?.(response);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail || "Could not dismiss this suggestion.");
    } finally {
      setDismissingId(null);
    }
  };

  if (linkedCount === 0 && pending.length === 0) {
    return null;
  }

  return (
    <div
      id={id}
      className="scroll-mt-24 space-y-4 rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/80 to-white p-4 ring-1 ring-brand-100/80"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-ink">Co-author publications on GRE</h3>
          <p className="mt-1 text-sm text-slate-600">
            {linkedCount > 0 ? (
              <>
                Your account is linked to{" "}
                <span className="font-semibold text-ink">
                  {linkedCount} published {linkedCount === 1 ? "study" : "studies"}
                </span>{" "}
                where you were listed as a co-author.
              </>
            ) : (
              <>
                We found GRE publications that may list you as a co-author based on your name.
                Confirm any matches to link them to your profile.
              </>
            )}
          </p>
        </div>
      </div>

      {linkedCount > 0 && data.linked_publications.length > 0 ? (
        <ul className="space-y-2">
          {data.linked_publications.slice(0, 5).map((pub) => (
            <li
              key={pub.id}
              className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-100"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="font-medium text-ink">{pub.title}</p>
                <p className="text-xs text-slate-500">
                  {pub.role}
                  {pub.lead_author_name ? ` · lead author ${pub.lead_author_name}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {pending.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            Papers that may be linked to you
          </p>
          <ul className="space-y-2">
            {pending.map((match) => {
              const confidence = confidenceLabel(match.match_confidence);
              return (
                <li
                  key={match.collaborator_id}
                  className="rounded-xl bg-white px-3 py-3 ring-1 ring-slate-100"
                >
                  <div className="flex items-start gap-2">
                    <BookOpenText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{match.publication_title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Listed as &ldquo;{match.listed_name}&rdquo;
                        {match.lead_author_name ? ` · lead author ${match.lead_author_name}` : ""}
                      </p>
                      {confidence ? (
                        <p className="mt-1 text-[11px] font-semibold text-brand-700">
                          {confidence}
                          {match.match_confidence != null ? ` (${Math.round(match.match_confidence)}%)` : ""}
                        </p>
                      ) : null}
                      {match.email_mismatch && match.listed_email_hint ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                          Listed with {match.listed_email_hint}, which differs from your GRE email.
                          You can still link this paper if the listing is you.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="min-w-0 flex-1 !py-2 text-xs"
                      loading={claimingId === match.collaborator_id}
                      disabled={busy && claimingId !== match.collaborator_id}
                      onClick={() => handleClaim(match.collaborator_id)}
                    >
                      Yes, this is me
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-w-0 flex-1 !py-2 text-xs"
                      loading={dismissingId === match.collaborator_id}
                      disabled={busy && dismissingId !== match.collaborator_id}
                      onClick={() => handleDismiss(match.collaborator_id)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Not me
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {linkedCount > 0 && profileUserId ? (
          <Link
            to={`/researcher/${profileUserId}`}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            View public profile
          </Link>
        ) : null}
        {showDoneButton && onDone ? (
          <Button className="flex-1" onClick={onDone}>
            Continue to dashboard
          </Button>
        ) : null}
      </div>
    </div>
  );
}
