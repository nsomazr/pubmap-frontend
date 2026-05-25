import api from "./api";
import type {
  PlagiarismClaimStatus,
  PublicationPlagiarismClaim,
  PublicationPlagiarismEvidence,
} from "../types";

export type PlagiarismDecision =
  | "hide"
  | "delete"
  | "address_claims"
  | "dismiss"
  | "restore"
  | "revision";

export type PlagiarismEvidence = PublicationPlagiarismEvidence;
export type PlagiarismClaim = PublicationPlagiarismClaim;

export const CLAIM_STATUS_LABELS: Record<PlagiarismClaimStatus, string> = {
  open: "Under review",
  dismissed: "Dismissed. Publication restored",
  restored: "Publication restored",
  hidden: "Hidden from publications",
  deleted: "Publication removed",
  revision: "Address claims requested",
};

export async function submitPlagiarismClaim(publicationId: number, description: string) {
  const { data } = await api.post<PlagiarismClaim>("/plagiarism-claims/", {
    publication_id: publicationId,
    description,
  });
  return data;
}

export async function uploadClaimEvidence(claimId: number, file: File, label?: string) {
  const form = new FormData();
  form.append("file", file);
  if (label) form.append("label", label);
  const { data } = await api.post<PlagiarismEvidence>(
    `/plagiarism-claims/${claimId}/evidence/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function resolvePlagiarismClaim(
  claimId: number,
  decision: PlagiarismDecision,
  adminNotes?: string
) {
  const { data } = await api.post<PlagiarismClaim>(`/plagiarism-claims/${claimId}/resolve/`, {
    decision,
    admin_notes: adminNotes,
  });
  return data;
}

export async function fetchPlagiarismStats() {
  const { data } = await api.get<{ open: number; resolved: number }>("/plagiarism-claims/stats/");
  return data;
}
