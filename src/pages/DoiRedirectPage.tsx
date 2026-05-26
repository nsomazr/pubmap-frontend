import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { buildPublicationPath } from "../lib/publicationPaths";
import type { Publication } from "../types";

export function DoiRedirectPage() {
  const { doi } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["publication-doi", doi],
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/by-doi/${doi}/`);
      return data;
    },
    enabled: !!doi,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Resolving DOI…</div>
    );
  }
  if (isError || !data?.id) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-slate-600">
        <p>Publication not found for DOI <strong>{doi}</strong></p>
      </div>
    );
  }
  return <Navigate to={buildPublicationPath(data.id, data.encoded_id)} replace />;
}
