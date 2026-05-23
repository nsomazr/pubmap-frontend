import { useQuery } from "@tanstack/react-query";
import api from "./api";

export interface CountryOption {
  code: string;
  name: string;
  has_catalog?: boolean;
}

export function useCountries() {
  return useQuery({
    queryKey: ["institutions", "countries"],
    queryFn: async () => {
      const { data } = await api.get<{ results: CountryOption[] }>("/institutions/countries/");
      return data.results;
    },
    staleTime: 300_000,
  });
}

export function countryLabel(code: string, countries: CountryOption[]): string {
  if (!code) return "";
  return countries.find((row) => row.code === code)?.name || code;
}
