import api from "./api";

export type PlagiarismClaimStatus =
  | "open"
  | "dismissed"
  | "restored"
  | "deleted"
  | "revision";

export type PlagiarismDecision = "restore" | "delete" | "revision" | "dismiss";

export interface PlagiarismEvidence {
  id: number;
  file_path: string;
  url: string;
  label: string;
  uploaded_at: string;
}

export interface PlagiarismClaim {
  id: number;
  publication_id: number;
  publication_title: string;
  publication_status: number;
  reporter_id: number;
  reporter_name: string;
  description: string;
  status: PlagiarismClaimStatus;
  admin_decision: string;
  admin_notes: string;
  resolved_by_id: number | null;
  resolved_by_name: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  evidence: PlagiarismEvidence[];
}

export const CLAIM_STATUS_LABELS: Record<PlagiarismClaimStatus, string> = {
  open: "Under review",
  dismissed: "Dismissed. Publication restored",
  restored: "Publication restored",
  deleted: "Publication removed",
  revision: "Revision requested",
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
