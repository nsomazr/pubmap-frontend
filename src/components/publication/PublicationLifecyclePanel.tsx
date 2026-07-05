import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import api, { parseApiError } from "../../lib/api";
import { publicationApiSegment } from "../../lib/publicationPaths";
import type { Publication } from "../../types";
import { useToast } from "../ui/ToastProvider";

interface Props {
  publication: Publication;
  isOwner: boolean;
  isAdmin: boolean;
  onChanged?: () => void;
}

const STATUS_DRAFT = 0;
const STATUS_PENDING = 1;
const STATUS_COMMENTED = 2;
const STATUS_PUBLISHED = 3;
const STATUS_ARCHIVED = 4;
const STATUS_DELETED = 6;

export function PublicationLifecyclePanel({
  publication,
  isOwner,
  isAdmin,
  onChanged,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const pubSeg = publicationApiSegment(publication.id, publication.encoded_id);
  const status = publication.status;
  const isDraft = status === STATUS_DRAFT;
  const isPrePublication = status === STATUS_PENDING || status === STATUS_COMMENTED;
  const isPublished = status === STATUS_PUBLISHED;
  const canAuthorRemove = isDraft || isPrePublication;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["publications"] });
    queryClient.invalidateQueries({ queryKey: ["publication-edit", pubSeg] });
    onChanged?.();
  };

  const archiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/archive/`),
    onSuccess: () => {
      invalidate();
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

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/unarchive/`),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication restored",
        description: "Your study is back in your workflow.",
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

  const removeMutation = useMutation({
    mutationFn: () => api.delete(`/publications/${pubSeg}/`),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: isDraft ? "Draft discarded" : "Submission withdrawn",
        description: isDraft
          ? "The draft was removed from your account."
          : "It was withdrawn before publication.",
      });
      navigate("/dashboard/publications");
    },
    onError: (error) => {
      setConfirmRemove(false);
      toast.error({
        title: isDraft ? "Could not discard draft" : "Could not withdraw",
        description: parseApiError(error, "Request failed."),
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubSeg}/restore/`),
    onSuccess: () => {
      invalidate();
      toast.success({
        title: "Publication restored",
        description: "The study is visible in your account again.",
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

  const canManage = isOwner || isAdmin;
  if (!canManage) return null;
  if (isAdmin) return null;

  if (status === STATUS_DELETED) {
    return null;
  }

  if (status === STATUS_ARCHIVED) {
    return (
      <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-ink">Archived</h2>
        <p className="mt-1 text-sm text-slate-600">
          This publication is off the public map. To remove it from GRE entirely, contact an admin.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            loading={unarchiveMutation.isPending}
            onClick={() => unarchiveMutation.mutate()}
          >
            <RotateCcw className="h-4 w-4" />
            Restore from archive
          </Button>
        </div>
      </section>
    );
  }

  if (isDraft) {
    return (
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">Draft</h2>
        <p className="mt-1 text-sm text-slate-500">
          Discard removes this unfinished draft from your account. It cannot be recovered.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!confirmRemove ? (
            <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>
              <Trash2 className="h-4 w-4" />
              Discard draft
            </Button>
          ) : (
            <>
              <Button
                type="button"
                loading={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                Confirm discard
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </section>
    );
  }

  if (isPrePublication) {
    return (
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">Under review</h2>
        <p className="mt-1 text-sm text-slate-500">
          Withdraw pulls this submission from review. It has not been published on the map.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!confirmRemove ? (
            <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>
              Withdraw submission
            </Button>
          ) : (
            <>
              <Button
                type="button"
                loading={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                Confirm withdraw
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </section>
    );
  }

  if (isPublished) {
    return (
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">Published on GRE</h2>
        <p className="mt-1 text-sm text-slate-500">
          Published studies stay in the research record. Archive removes this study from the public
          map while keeping it in your account. Only GRE admins can delete published work.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            loading={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Publication lifecycle</h2>
      <p className="mt-1 text-sm text-slate-500">
        Archive removes a study from the public map. Contact GRE admin if you need a published record
        removed.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={archiveMutation.isPending}
          onClick={() => archiveMutation.mutate()}
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>
        {canAuthorRemove && !confirmRemove ? (
          <Button type="button" variant="secondary" onClick={() => setConfirmRemove(true)}>
            <Trash2 className="h-4 w-4" />
            {isDraft ? "Discard draft" : "Withdraw"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
