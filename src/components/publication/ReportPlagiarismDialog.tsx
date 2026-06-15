import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Paperclip, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import { buildLoginPath } from "../../lib/authRedirect";
import {
  submitPlagiarismClaim,
  uploadClaimEvidence,
  type PlagiarismClaim,
} from "../../lib/plagiarism";

interface Props {
  publicationId: number;
  publicationTitle: string;
  onClose: () => void;
  onSubmitted?: (claim: PlagiarismClaim) => void;
}

export function ReportPlagiarismDialog({
  publicationId,
  publicationTitle,
  onClose,
  onSubmitted,
}: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [claimId, setClaimId] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const claim = await submitPlagiarismClaim(publicationId, description.trim());
      for (const file of files) {
        await uploadClaimEvidence(claim.id, file, file.name);
      }
      return claim;
    },
    onSuccess: (claim) => {
      setClaimId(claim.id);
      setSuccess(true);
      onSubmitted?.(claim);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(detail || "Could not submit your report. Try again.");
    },
  });

  const dialog = !user ? (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
      <div className="flex min-h-full items-start justify-center py-6 sm:items-center sm:py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
          <h2 className="text-lg font-bold text-ink">Sign in required</h2>
          <p className="mt-2 text-sm text-slate-600">
            You need a GRE account to submit a plagiarism report.
          </p>
          <div className="mt-5 flex gap-3">
            <Link to={buildLoginPath(`${location.pathname}${location.search}`)} className="flex-1">
              <Button className="w-full">Sign in</Button>
            </Link>
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-900/50 p-4 sm:p-6">
      <div className="flex min-h-full items-start justify-center py-6 sm:items-center sm:py-10">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true">
          <div className="max-h-[min(100dvh-3rem,90vh)] overflow-y-auto rounded-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-ink">Report plagiarism concern</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{publicationTitle}</p>
              </div>
              <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {success ? (
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-700">
                  Your report {claimId ? `#${claimId} ` : ""}was submitted. The publication has
                  been temporarily hidden while administrators review the evidence. The author has
                  been notified.
                </p>
                <Link to="/dashboard/plagiarism">
                  <Button className="w-full">Track your claim</Button>
                </Link>
                <Button variant="secondary" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4 p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  if (description.trim().length < 20) {
                    setError("Please provide at least 20 characters describing your concern.");
                    return;
                  }
                  submitMutation.mutate();
                }}
              >
                <Textarea
                  label="Your report"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Explain the overlap, missing attribution, or other concern…"
                  required
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Evidence (optional)
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-brand-300 hover:text-brand-700">
                    <Paperclip className="h-4 w-4" />
                    Attach PDF, document, or image
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.gif"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {files.map((f) => (
                        <li key={f.name}>{f.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
                    {error}
                  </p>
                )}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:gap-3">
                  <Button type="submit" loading={submitMutation.isPending} className="w-full sm:flex-1">
                    Submit report
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
