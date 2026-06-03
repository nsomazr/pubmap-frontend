import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import api from "../../lib/api";
import type { Publication } from "../../types";

interface Props {
  publication: Publication;
  isOwner: boolean;
  isAdmin: boolean;
  onChanged?: () => void;
}

export function PublicationLifecyclePanel({
  publication,
  isOwner,
  isAdmin,
  onChanged,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pubId = publication.id;
  const status = publication.status;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["publications"] });
    queryClient.invalidateQueries({ queryKey: ["publication-edit", String(pubId)] });
    onChanged?.();
  };

  const archiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubId}/archive/`),
    onSuccess: () => {
      invalidate();
      navigate("/dashboard/publications?status=4");
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubId}/unarchive/`),
    onSuccess: () => {
      invalidate();
      navigate("/dashboard/publications");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/publications/${pubId}/`),
    onSuccess: () => {
      invalidate();
      navigate(isAdmin ? "/dashboard/publications?status=6" : "/dashboard/publications");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/publications/${pubId}/restore/`),
    onSuccess: () => {
      invalidate();
      navigate("/dashboard/publications");
    },
  });

  const canManage = isOwner || isAdmin;
  if (!canManage) return null;
  if (isAdmin) return null;

  if (status === 6) {
    if (!isAdmin) return null;
    return (
      <section className="mb-6 rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-sm font-semibold text-red-900">Deleted publication</h2>
        <p className="mt-1 text-sm text-red-800/90">
          This study was soft-deleted and is hidden from authors and the public map. Restore it to
          return it to its previous workflow state.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            loading={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate()}
          >
            <RotateCcw className="h-4 w-4" />
            Restore publication
          </Button>
        </div>
      </section>
    );
  }

  if (status === 4) {
    return (
      <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-ink">Archived</h2>
        <p className="mt-1 text-sm text-slate-600">
          This publication is off the public map but preserved in your account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            loading={unarchiveMutation.isPending}
            onClick={() => unarchiveMutation.mutate()}
          >
            <RotateCcw className="h-4 w-4" />
            Restore from archive
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="secondary"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">Publication lifecycle</h2>
      <p className="mt-1 text-sm text-slate-500">
        Archive removes a study from the public map while keeping your files. Delete moves it to the
        admin recovery queue (GRE admins can remove it permanently).
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
        {!confirmDelete ? (
          <Button type="button" variant="secondary" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : (
          <>
            <Button
              type="button"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Confirm delete
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
