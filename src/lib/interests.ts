import { useQuery } from "@tanstack/react-query";
import api from "./api";

export interface ResearchInterest {
  id: number | null;
  label: string;
  sub_category_id?: number | null;
  source?: string;
  usage_count?: number;
  publication_count?: number;
  category_name?: string | null;
}

export interface InterestCollaborator {
  id: number;
  full_name?: string;
  firstname: string;
  lastname: string;
  affiliation?: string;
  area_of_study?: string;
  photo?: string;
  match_reason?: string | null;
}

export function usePopularInterests(limit = 12) {
  return useQuery({
    queryKey: ["interests", "popular", limit],
    queryFn: async () => {
      const { data } = await api.get<{ results: ResearchInterest[] }>("/interests/popular/", {
        params: { limit },
      });
      return data.results;
    },
    staleTime: 120_000,
  });
}

export async function searchInterests(query: string, limit = 12): Promise<ResearchInterest[]> {
  const { data } = await api.get<{ results: ResearchInterest[] }>("/interests/search/", {
    params: { q: query, limit },
  });
  return data.results;
}

export async function fetchInterestSuggestions(payload: {
  selected: string[];
  affiliation?: string;
  limit?: number;
}): Promise<string[]> {
  const { data } = await api.post<{ suggestions: string[]; available: boolean }>(
    "/assistant/interest-suggestions/",
    payload
  );
  return data.suggestions ?? [];
}

export async function previewInterestCollaborators(payload: {
  interests: string[];
  affiliation?: string;
  limit?: number;
}): Promise<InterestCollaborator[]> {
  const { data } = await api.post<{ collaborators: InterestCollaborator[] }>(
    "/interests/collaborators/preview/",
    payload
  );
  return data.collaborators ?? [];
}

export function normalizeInterestLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export function uniqueInterestLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    const key = normalizeInterestLabel(label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
