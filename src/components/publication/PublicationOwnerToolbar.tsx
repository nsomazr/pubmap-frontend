import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, ExternalLink, MapPin, PencilLine } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { parseApiError } from "../../lib/api";
import {
  buildDashboardPublicationPath,
  buildPublicationPath,
  publicationApiSegment,
} from "../../lib/publicationPaths";
import type { Publication } from "../../types";
import { useToast } from "../ui/ToastProvider";

type Props = {
  publication: Publication;
  isOwner: boolean;
};

export function PublicationOwnerToolbar({ publication, isOwner }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const pubSeg = publicationApiSegment(publication.id, publication.encoded_id);
  const publicPath = buildPublicationPath(publication.id, publication.encoded_id);
  const isPublished = publication.status === 3;

  const archiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/archive/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["publication-reader", pubSeg] });
      toast.success({
        title: "Publication archived",
        description: "It is off the public map but still in your account.",
      });
      navigate("/dashboard/publications?status=4");
    },
    onError: (error) => {
      toast.error({
        title: "Could not archive",
        description: parseApiError(error, "Archive failed."),
      });
    },
  });

  const actionBtn =
    "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto";

  return (
    <div className="space-y-3">
      <Link
        to="/dashboard/publications"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to publications
      </Link>

      {isOwner ? (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
          <p className="text-sm font-semibold text-slate-800">Manage this publication</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {isPublished
              ? "Edit details, open the public map page, or archive when needed."
              : "Edit details or continue your submission workflow."}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to={buildDashboardPublicationPath(publication.id, publication.encoded_id)}
              className={`${actionBtn} bg-brand-600 text-white hover:bg-brand-700`}
            >
              <PencilLine className="h-4 w-4" />
              Edit publication
            </Link>
            {isPublished ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className={`${actionBtn} border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-800`}
              >
                <MapPin className="h-4 w-4" />
                View on map
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            ) : null}
            {isPublished && !confirmArchive ? (
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className={`${actionBtn} border border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:text-amber-900`}
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            ) : null}
            {isPublished && confirmArchive ? (
              <>
                <button
                  type="button"
                  disabled={archiveMutation.isPending}
                  onClick={() => archiveMutation.mutate()}
                  className={`${actionBtn} bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60`}
                >
                  Confirm archive
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmArchive(false)}
                  className={`${actionBtn} border border-slate-200 bg-white text-slate-700`}
                >
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
