import { useQuery } from "@tanstack/react-query";
import api from "./api";

export interface Institution {
  id: number;
  label: string;
  normalized?: string;
  country_code?: string;
  usage_count?: number;
}

export function usePopularInstitutions(limit = 10) {
  return useQuery({
    queryKey: ["institutions", "popular", limit],
    queryFn: async () => {
      const { data } = await api.get<{ results: Institution[] }>("/institutions/popular/", {
        params: { limit },
      });
      return data.results;
    },
    staleTime: 120_000,
  });
}

export function useInstitutionsByCountry(countryCode: string, query = "", limit = 200) {
  return useQuery({
    queryKey: ["institutions", "by-country", countryCode, query, limit],
    queryFn: async () => {
      if (!countryCode) return [] as Institution[];
      const { data } = await api.get<{ results: Institution[] }>("/institutions/by-country/", {
        params: { country: countryCode, q: query || undefined, limit },
      });
      return data.results;
    },
    enabled: Boolean(countryCode),
    staleTime: 120_000,
  });
}

export async function searchInstitutions(
  query: string,
  limit = 12,
  countryCode?: string
): Promise<Institution[]> {
  const { data } = await api.get<{ results: Institution[] }>("/institutions/search/", {
    params: {
      q: query,
      limit,
      country: countryCode || undefined,
    },
  });
  return data.results;
}

export function normalizeInstitutionLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}
