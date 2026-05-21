import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  MapPin,
  MessageSquareWarning,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../dashboard/StatusBadge";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import api from "../../lib/api";
import { abstractPlainText } from "../../lib/abstractText";
import { authorDisplayName } from "../../lib/userDisplay";
import type { Publication } from "../../types";
import { PdfPreview } from "./PdfPreview";

interface Props {
  pub: Publication;
  compact?: boolean;
  onReviewed?: () => void;
}

export function AdminPublicationReviewCard({ pub, compact, onReviewed }: Props) {
  const queryClient = useQueryClient();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const docPath = pub.documents?.[0]?.document ?? null;
  const hasPdf = Boolean(docPath && /\.pdf$/i.test(docPath.split("?")[0]));
  const author = authorDisplayName(pub.author);

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pub.id}/accept/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-review"] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(pub.id)] });
      onReviewed?.();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (comment: string) =>
      api.post(`/publications/${pub.id}/admin_comment/`, { comment }),
    onSuccess: () => {
      setCommentOpen(false);
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["admin-review"] });
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(pub.id)] });
      onReviewed?.();
    },
  });

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "" : "ring-1 ring-slate-100/80"
      }`}
    >
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Submission for review
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">{author}</p>
              <h3 className="mt-1 text-lg font-bold leading-snug text-ink">{pub.title}</h3>
              {pub.sub_category_name && (
                <span className="mt-2 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  {pub.sub_category_name}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={pub.status} />
        </div>
      </div>

      <div className={`grid gap-6 p-5 ${docPath && !compact ? "lg:grid-cols-2" : ""}`}>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Abstract</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {abstractPlainText(pub.abstract) || "—"}
            </p>
          </div>
          {pub.coordinates && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Study location
              </h4>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                {pub.coordinates.location}
                {pub.coordinates.institution && ` · ${pub.coordinates.institution}`}
              </p>
            </div>
          )}
          {!docPath && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No manuscript file attached.
            </p>
          )}
        </div>

        {docPath ? (
          <div className="min-w-0">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Manuscript {hasPdf ? "(PDF)" : ""}
            </h4>
            <PdfPreview
              documentPath={docPath}
              title={pub.title}
              allowExpand={hasPdf}
              className={compact ? "min-h-[300px]" : "min-h-[min(50vh,480px)]"}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
        <Button
          type="button"
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve & publish
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCommentOpen((v) => !v)}
        >
          <MessageSquareWarning className="h-4 w-4" />
          Request revision
        </Button>
        <Link
          to={`/dashboard/publications/${pub.id}`}
          className="inline-flex items-center self-center px-3 text-sm font-medium text-brand-600 hover:underline"
        >
          Edit record
        </Link>
      </div>

      {commentOpen && (
        <form
          className="border-t border-amber-200 bg-amber-50/50 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (commentText.trim()) commentMutation.mutate(commentText.trim());
          }}
        >
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertCircle className="h-4 w-4" />
            Revision notes for the author
          </p>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
            className="mt-3"
            placeholder="Explain what should be updated…"
            required
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" loading={commentMutation.isPending}>
              Send revision request
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCommentOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </article>
  );
}
