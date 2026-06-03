import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { parseApiError } from "../../lib/api";
import { publicationApiSegment } from "../../lib/publicationPaths";
import type { Publication } from "../../types";
import { Button } from "../ui/Button";
import { useToast } from "../ui/ToastProvider";

interface Props {
  publication: Publication;
  variant?: "card" | "panel";
  onChanged?: () => void;
}

export function AdminPublicationActions({
  publication,
  variant = "panel",
  onChanged,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pubSeg = publicationApiSegment(publication.id, publication.encoded_id);
  const status = publication.status;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-review"] });
    queryClient.invalidateQueries({ queryKey: ["publications"] });
    queryClient.invalidateQueries({ queryKey: ["publication-review", publication.id] });
    queryClient.invalidateQueries({ queryKey: ["publication-edit", pubSeg] });
    onChanged?.();
  };

  const archiveMutation = useMutation({
    mutationFn: () =>
      api.post(`/publications/${pubSeg}/hide/`, {
        reason: "Archived by GRE admin",
      }),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication archived",
        description: "It is hidden from the public map and publication pages.",
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

  const permanentDeleteMutation = useMutation({
    mutationFn: () =>
      api.post(`/publications/${pubSeg}/permanent_delete/`, { confirm: "delete" }),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication deleted",
        description: "The research record and files were removed from GRE.",
      });
      navigate("/dashboard/publications?status=5");
    },
    onError: (error) => {
      toast.error({
        title: "Could not delete",
        description: parseApiError(error, "Delete failed."),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/restore/`),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication restored",
        description: "The study was returned to its previous workflow state.",
      });
      navigate("/dashboard/publications");
    },
    onError: (error) => {
      toast.error({
        title: "Could not restore",
        description: parseApiError(error, "Restore failed."),
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/unhide/`),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication restored",
        description: "The study is visible on the public site again.",
      });
      navigate("/dashboard/publications?status=3");
    },
    onError: (error) => {
      toast.error({
        title: "Could not restore",
        description: parseApiError(error, "Restore failed."),
      });
    },
  });

  const shellClass =
    variant === "card"
      ? "flex flex-wrap items-center gap-2 border-t border-slate-100 bg-violet-50/40 px-4 py-3 sm:px-5"
      : "rounded-2xl border border-violet-200 bg-violet-50/40 p-5";

  const showArchive = status === 3;
  const showUnarchive = status === 4;
  const showSoftRestore = status === 6;

  return (
    <div className={shellClass}>
      {variant === "panel" && (
        <>
          <h2 className="text-sm font-semibold text-violet-900">Admin actions</h2>
          <p className="mt-1 text-sm text-violet-800/90">
            {status === 4
              ? "This study is hidden from the public map. Restore it or delete it permanently."
              : status === 6
                ? "This study is in the deleted queue. Permanently remove it to purge all GRE data."
                : "Archive hides this study from the public site. Delete removes it from GRE entirely."}
          </p>
        </>
      )}
      <div className={`flex flex-wrap gap-2 ${variant === "panel" ? "mt-4" : ""}`}>
        {showSoftRestore && (
          <Button
            type="button"
            variant="secondary"
            loading={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate()}
          >
            <RotateCcw className="h-4 w-4" />
            Restore from deleted queue
          </Button>
        )}
        {showUnarchive && (
          <Button
            type="button"
            variant="secondary"
            loading={unarchiveMutation.isPending}
            onClick={() => unarchiveMutation.mutate()}
          >
            <RotateCcw className="h-4 w-4" />
            Restore to public
          </Button>
        )}
        {showArchive && (
          <Button
            type="button"
            variant="secondary"
            loading={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            <Archive className="h-4 w-4" />
            Archive (hide public)
          </Button>
        )}
        {!confirmDelete ? (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete permanently
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="danger"
              loading={permanentDeleteMutation.isPending}
              onClick={() => permanentDeleteMutation.mutate()}
            >
              Confirm permanent delete
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </>
        )}
      </div>
      {variant === "panel" && confirmDelete && (
        <p className="mt-3 text-xs leading-relaxed text-red-800">
          This cannot be undone. Manuscript files, map pin, discussions, and GRE metadata for this
          publication will be removed.
        </p>
      )}
    </div>
  );
}
